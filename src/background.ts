import browser, { Runtime } from "webextension-polyfill";

interface RequestMessage {
  message: string;
  url: string;
  method: string;
  data?: any;
  priority?: "high" | "low" | "auto";
  ignoreCache?: boolean;
}

const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
const TOS_CACHE_EXPIRATION = 60 * 1000 * 5; // 1 minutes

const sendRequestToServer = async (
  url: string,
  method: string,
  data?: any,
  priority?: "high" | "low" | "auto"
): Promise<any> => {
  const { token } = await browser.storage.local.get("token");

  return fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: data ? JSON.stringify(data) : null,
    priority: priority ?? "auto",
  })
    .then((response) => response.json())
    .then((responseData) => {
      if (method === "GET") setCachedData(url, responseData);
      return responseData;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
};

const getCachedData = async (cacheKey: string, ignoreCache = false) => {
  if (ignoreCache) return null;

  try {
    const result = await browser.storage.local.get(cacheKey);
    const cachedData = result[cacheKey];
    if (cachedData) {
      const { data, timestamp } = cachedData;
      if (
        new Date().getTime() - timestamp <
        (cacheKey.toLowerCase().includes("tos")
          ? TOS_CACHE_EXPIRATION
          : CACHE_EXPIRATION)
      ) {
        return data;
      }
      await browser.storage.local.remove(cacheKey);
    }
    return null;
  } catch (error) {
    console.error("Error getting cached data:", error);
    return null;
  }
};

const setCachedData = async (cacheKey: string, data: any) => {
  const cacheItem = { data, timestamp: new Date().getTime() };
  try {
    await browser.storage.local.set({ [cacheKey]: cacheItem });
    console.log(`Cache set for key: ${cacheKey}`);
  } catch (error) {
    console.error("Error setting cache:", error);
  }
};

const login = async () => {
  const redirectUrl = browser.identity.getRedirectURL();
  console.log(redirectUrl);

  if (!redirectUrl) {
    return;
  }

  const responseUrl = await browser.identity.launchWebAuthFlow({
    url: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=tqj580q6bs92pt112t5v6tljgx0oyu&redirect_uri=${encodeURIComponent(
      redirectUrl
    )}&scope=user:read:email`,
    interactive: true,
  });

  const code = new URL(responseUrl).searchParams.get("code");

  if (!code) {
    return;
  }

  const response = await fetch(
    `https://api.canireact.com/auth/twitch/code/${code}`,
    {
      method: "POST",
    }
  );

  if (response.status !== 200) {
    return;
  }

  const { token, display_name, profile_image_url } = await response.json();

  browser.storage.local.set({
    token,
    display_name,
    profile_image_url,
  });
};

browser.runtime.onConnect.addListener(async (port) => {
  const { collapseState } = await browser.storage.local.get("collapseState");
  const { minimizedState } = await browser.storage.local.get("minimizedState");
  const { sponsorRemindersActive } = await browser.storage.local.get(
    "sponsorRemindersActive"
  );
  const { display_name } = await browser.storage.local.get("display_name");
  const { profile_image_url } =
    await browser.storage.local.get("profile_image_url");

  if (display_name !== undefined && profile_image_url !== undefined) {
    port.postMessage({
      message: "setProfile",
      data: {
        display_name: display_name,
        profile_image_url: profile_image_url,
      },
    });
  }

  if (collapseState !== undefined) {
    port.postMessage({
      message: "setCollapseState",
      data: collapseState,
    });
  }

  if (minimizedState !== undefined) {
    port.postMessage({
      message: "setReactionInfoMinimized",
      data: minimizedState,
    });
  }

  if (sponsorRemindersActive !== undefined) {
    port.postMessage({
      message: "setSponsorRemindersActive",
      data: sponsorRemindersActive,
    });
  }

  port.onMessage.addListener((msg) => {
    console.log(msg);
  });
});

browser.runtime.onMessage.addListener(
  (
    request: RequestMessage,
    sender: Runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    console.log("Received message:", request);

    if (request.message === "sendRequest") {
      const cacheKey = request.url;

      getCachedData(cacheKey, request.ignoreCache)
        .then((cachedData) => {
          if (cachedData) {
            console.log("Using cached data");
            sendResponse({ success: true, data: cachedData });
          } else {
            console.log("Fetching new data");
            sendRequestToServer(
              request.url,
              request.method,
              request.data,
              request.priority
            )
              .then((data) => {
                sendResponse({ success: true, data });
              })
              .catch((error) => {
                sendResponse({ success: false, error: error.toString() });
              });
          }
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.toString() });
        });

      return true; // Keeps the message channel open for sendResponse
    } else if (request.message === "setCollapseState") {
      browser.storage.local.set({ collapseState: request.data });
    } else if (request.message === "setReactionInfoMinimized") {
      browser.storage.local.set({ minimizedState: request.data });
    } else if (request.message === "setSponsorRemindersActive") {
      browser.storage.local.set({ sponsorRemindersActive: request.data });
    } else if (request.message === "openLogin") {
      login()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.toString() });
        });

      return true;
    } else if (request.message === "invalidateCache") {
      browser.storage.local.remove(request.url);
    }
  }
);

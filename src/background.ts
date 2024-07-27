import browser, { Runtime } from 'webextension-polyfill';

interface RequestMessage {
    message: string;
    url: string;
    method: string;
    data?: any;
    priority?: "high" | "low" | "auto";
}

const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

const sendRequestToServer = async (url: string, method: string, data?: any, priority?: "high" | "low" | "auto"): Promise<any> => {
    const { token } = await browser.storage.local.get("token");

    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: data ? JSON.stringify(data) : null,
        priority: priority ?? "auto"
    })
        .then(response => response.json())
        .then(responseData => {
            setCachedData(url, responseData);
            return responseData;
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
};

const getCachedData = async (cacheKey: string) => {
    try {
        const result = await browser.storage.local.get(cacheKey);
        const cachedData = result[cacheKey];
        if (cachedData) {
            const { data, timestamp } = cachedData;
            if (new Date().getTime() - timestamp < CACHE_EXPIRATION) {
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

browser.runtime.onConnect.addListener(async (port) => {
    const { collapseState } = await browser.storage.local.get("collapseState")
    const { display_name } = await browser.storage.local.get("display_name")
    const { profile_image_url } = await browser.storage.local.get("profile_image_url")

    if (collapseState !== undefined) {
        port.postMessage({
            message: "setCollapseState",
            data: collapseState
        })
    }

    if (display_name !== undefined && profile_image_url !== undefined) {
        port.postMessage({
            message: "setProfile",
            data: {
                display_name: display_name,
                profile_image_url: profile_image_url
            }
        })
    }

    port.onMessage.addListener(msg => {
        console.log(msg);
    });
});

browser.runtime.onMessage.addListener((request: RequestMessage, sender: Runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log('Received message:', request);

    if (request.message === "sendRequest") {
        const cacheKey = request.url;

        getCachedData(cacheKey)
            .then(cachedData => {
                if (cachedData) {
                    console.log('Using cached data');
                    sendResponse({ success: true, data: cachedData });
                } else {
                    console.log('Fetching new data');
                    sendRequestToServer(request.url, request.method, request.data, request.priority)
                        .then(data => {
                            sendResponse({ success: true, data });
                        })
                        .catch(error => {
                            sendResponse({ success: false, error: error.toString() });
                        });
                }
            })
            .catch(error => {
                sendResponse({ success: false, error: error.toString() });
            });

        return true; // Keeps the message channel open for sendResponse
    } else if (request.message === "setCollapseState") {
        browser.storage.local.set({ "collapseState": request.data });
    }
});
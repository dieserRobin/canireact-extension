import "../extension-styles.css";

import { isProduction, log } from "./utils";
import { handleThumbnails } from "./utils/thumbnails";
import { fetchVideoInfo } from "./utils/api";
import { getChannelUrl } from "./utils/youtube";
import {
  addOriginalVideoOnly,
  addReactionInfo,
  removeInfo,
} from "./components/reaction-info";
import { removeAllThumbnailInfos } from "./components/thumbnail-info";
import browser from "webextension-polyfill";
import { getLanguage } from "./utils/language";
import Settings from "./components/settings";
import { addTosSegments } from "./components/tos-segments";

export let API_URL = "https://api.canireact.com";
export let hasProcessed = false;
export let currentChannelUrl: string | null = null;
export let collapseState: boolean = false;
export let settingsDropdown: Settings | null = null;
export let reactionInfoMinimized: boolean = false;
export let sponsorRemindersActive = true;

let currentChannelNameObserver: MutationObserver | null = null;
let latestRequest: string | null = null;
export let currentProfile: {
  name: string;
  image: string;
} | null = null;

async function main() {
  const isProd = isProduction();
  log("main.js loaded!");
  log(`environment: ${isProd ? "production" : "development"}`);

  let port = browser.runtime.connect();
  port.postMessage({ message: "hello" });

  setInterval(
    () => {
      port.postMessage({ message: "keepAlive" });
    },
    1000 * 60 * 5
  );

  port.onMessage.addListener((message) => {
    log("message received", message);
    if (message.message === "setCollapseState") {
      collapseState = message.data;
    } else if (message.message === "setReactionInfoMinimized") {
      reactionInfoMinimized = message.data;
    } else if (message.message === "setSponsorRemindersActive") {
      sponsorRemindersActive = message.data;
    } else if (message.message === "setProfile") {
      currentProfile = {
        name: message.data.display_name,
        image: message.data.profile_image_url,
      };
    }
  });

  await processCurrentPage();
  await registerThumbnailObserver();

  document.addEventListener("yt-navigate-finish", async function () {
    log("switched page, processing...");

    await removeInfo();
    await removeAllThumbnailInfos();
    currentChannelNameObserver?.disconnect();
    await processCurrentPage();
    hasProcessed = false;
  });
}

async function registerThumbnailObserver(): Promise<void> {
  window.addEventListener("updateui", handleThumbnails);
  window.addEventListener("state-navigateend", handleThumbnails);

  setInterval(async () => {
    handleThumbnails();
  }, 3000);
}

async function processCurrentPage(): Promise<void> {
  // Check if the current page is a watch page
  if (window.location.href.includes("watch")) {
    log("video detected!");

    // Get video id
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) {
      log("video id not found");
      return;
    }
    log("video id: " + videoId);

    const upperRowObserver = new MutationObserver(async (_, obs) => {
      const upperRow = document.querySelector(
        "#above-the-fold #top-row #actions #actions-inner #menu #top-level-buttons-computed"
      );
      if (upperRow) {
        obs.disconnect();
        settingsDropdown && settingsDropdown.destroy();
        settingsDropdown = new Settings();
      }
    });

    upperRowObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Wait for the bottom row to be available in the DOM
    const observer = new MutationObserver(async (_, obs) => {
      const channelUrl = await getChannelUrl();
      currentChannelUrl = channelUrl;
      log("channel url: " + channelUrl);

      setTimeout(() => {
        settingsDropdown && settingsDropdown.destroy();
        settingsDropdown = new Settings();
      }, 500);

      if (hasProcessed && currentChannelUrl === channelUrl) {
        obs.disconnect();
        return; // Exit if already processed
      }

      addTosSegments(videoId)
        .then(() => {
          log("tos segments added");
        })
        .catch((e) => {
          log("error adding tos segments: " + e);
        });

      const bottomRows: NodeListOf<HTMLElement> =
        document.querySelectorAll("#bottom-row");
      const bottomRow = bottomRows[bottomRows.length - 1];

      if (bottomRow && channelUrl) {
        hasProcessed = true;

        observeChannelNameChange(videoId);

        const currentRequest = `${videoId}-${channelUrl}`;
        latestRequest = currentRequest;

        // Fetch video info
        const response = await fetchVideoInfo(
          videoId,
          channelUrl,
          false,
          getLanguage()?.toLowerCase() ?? "en"
        );
        log(`video info: ${JSON.stringify(response)}`);

        if (latestRequest !== currentRequest) {
          obs.disconnect();
          return;
        }

        if (response && (response.rules || response.info_text)) {
          addReactionInfo(bottomRow, response, bottomRows.length === 2);
        } else {
          log("no rules found for this video");
          removeInfo();
          addOriginalVideoOnly(bottomRow);
        }

        obs.disconnect(); // Stop observing after the element is found and handled
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

export async function toggleSponsorReminders() {
  sponsorRemindersActive = !sponsorRemindersActive;
  log("sponsor reminders active: " + sponsorRemindersActive);
  await browser.runtime.sendMessage({
    message: "setSponsorRemindersActive",
    data: sponsorRemindersActive,
  });
}

export async function toggleMinimize() {
  reactionInfoMinimized = !reactionInfoMinimized;
  log("minimized: " + reactionInfoMinimized);
  await browser.runtime.sendMessage({
    message: "setReactionInfoMinimized",
    data: reactionInfoMinimized,
  });

  if (reactionInfoMinimized) {
    removeInfo();
  } else {
    fetchAndAddReactionInfo();
  }
}

export async function fetchAndAddReactionInfo() {
  const videoId = new URL(window.location.href).searchParams.get("v");
  if (!videoId) {
    log("video id not found");
    return;
  }

  const bottomRow: HTMLElement | null = document.querySelector("#bottom-row");

  if (!bottomRow) {
    return;
  }

  const channelUrl = await getChannelUrl();

  if (!channelUrl) {
    return;
  }

  // Fetch video info
  const response = await fetchVideoInfo(videoId, channelUrl);
  log(`video info: ${JSON.stringify(response)}`);

  if (response && (response.rules || response.info_text)) {
    addReactionInfo(bottomRow, response);
  } else {
    log("no rules found for this video");
    removeInfo();
    addOriginalVideoOnly(bottomRow);
  }
}

async function observeChannelNameChange(videoId: string) {
  log("observing channel name change");

  const observer = new MutationObserver(async (_, obs) => {
    const channelUrl = await getChannelUrl();
    currentChannelUrl = channelUrl;
    log("channel url: " + channelUrl, currentChannelUrl);

    const bottomRow: HTMLElement | null = document.querySelector("#bottom-row");
    if (bottomRow) {
      hasProcessed = true;

      const currentRequest = `${videoId}-${channelUrl}`;
      latestRequest = currentRequest;

      // Fetch video info
      const response = await fetchVideoInfo(videoId, channelUrl);
      log(`video info: ${JSON.stringify(response)}`);

      if (latestRequest !== currentRequest) {
        return;
      }

      if (response && (response.rules || response.info_text)) {
        addReactionInfo(bottomRow, response);
      } else {
        log("no rules found for this video");
        removeInfo();
        addOriginalVideoOnly(bottomRow);
      }

      obs.disconnect(); // Stop observing after the element is found and handled
    }
  });

  const channelNameEl = document.querySelector(
    "#above-the-fold ytd-channel-name yt-formatted-string a"
  );

  if (!channelNameEl) {
    return null;
  }

  observer.observe(channelNameEl, {
    childList: true,
    subtree: true,
  });

  currentChannelNameObserver = observer;
  return observer;
}

main();

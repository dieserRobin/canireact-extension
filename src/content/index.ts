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
import { addTosSegments, removeTosSegments } from "./components/tos-segments";

export let API_URL = "https://api.canireact.com";
export let hasProcessed = false;
export let currentChannelUrl: string | null = null;
export let collapseState: boolean = false;
export let settingsDropdown: Settings | null = null;
export let reactionInfoMinimized: boolean = false;
export let sponsorRemindersActive = true;
export let currentVideoId: string | null = null;

const ACTIONS_CONTAINER_SELECTOR =
  "#above-the-fold #top-row #actions #actions-inner #menu #top-level-buttons-computed";
const REACTION_INFO_SELECTOR = "#reaction-info";

let currentChannelNameObserver: MutationObserver | null = null;
let latestRequest: string | null = null;
export let currentProfile: {
  name: string;
  image: string;
} | null = null;

export function destroySettingsDropdown() {
  if (settingsDropdown) {
    settingsDropdown.destroy();
    settingsDropdown = null;
  }
}

// YouTube re-renders the actions row regularly and drops foreign children.
// Re-mounting on every removal leads to an insert/remove loop (issue #16),
// so the number of re-mounts per video is capped.
const MAX_SETTINGS_REMOUNTS = 5;
let settingsMountCount = 0;

function resetSettingsMountCount() {
  settingsMountCount = 0;
}

/**
 * Makes sure the settings button is mounted.
 * Returns true if the button is present after the call.
 */
export function ensureSettingsMounted(): boolean {
  if (document.getElementById("cir-settings")) {
    return true;
  }

  const container = document.querySelector(ACTIONS_CONTAINER_SELECTOR);
  if (!container) {
    return false;
  }

  if (settingsMountCount > MAX_SETTINGS_REMOUNTS) {
    return false;
  }

  if (settingsMountCount === MAX_SETTINGS_REMOUNTS) {
    settingsMountCount++;
    log("settings button removed too often by YouTube, giving up remounting");
    return false;
  }

  settingsMountCount++;
  destroySettingsDropdown();
  settingsDropdown = new Settings();
  return true;
}

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

    const newVideoId = new URL(window.location.href).searchParams
      .get("v")
      ?.toString();

    const reactionInfoExists = document.querySelector(REACTION_INFO_SELECTOR);

    if (
      newVideoId &&
      newVideoId === currentVideoId &&
      hasProcessed &&
      reactionInfoExists
    ) {
      log("navigation event fired but video unchanged, skipping");
      ensureSettingsMounted();
      return;
    }

    await removeInfo();
    await removeAllThumbnailInfos();
    destroySettingsDropdown();
    currentChannelNameObserver?.disconnect();
    currentChannelNameObserver = null;
    currentVideoId = null;
    hasProcessed = false;
    await processCurrentPage();
  });
}

async function registerThumbnailObserver(): Promise<void> {
  window.addEventListener("updateui", handleThumbnails);
  window.addEventListener("state-navigateend", handleThumbnails);

  setInterval(async () => {
    handleThumbnails();
  }, 3000);
}

// How often the page setup check may run while YouTube is mutating the DOM.
const PAGE_CHECK_THROTTLE_MS = 250;
// Stop watching the DOM after this time, even if not everything was found.
const PAGE_SETUP_TIMEOUT_MS = 20_000;

// Incremented for every processed video so stale async work can bail out.
let pageGeneration = 0;
let pageObserver: MutationObserver | null = null;
let pageCheckTimeout: ReturnType<typeof setTimeout> | null = null;
let pageSetupDeadline: ReturnType<typeof setTimeout> | null = null;

function stopPageObserver() {
  pageObserver?.disconnect();
  pageObserver = null;
  if (pageCheckTimeout !== null) clearTimeout(pageCheckTimeout);
  if (pageSetupDeadline !== null) clearTimeout(pageSetupDeadline);
  pageCheckTimeout = null;
  pageSetupDeadline = null;
}

async function renderGuidelines(
  videoId: string,
  channelUrl: string,
  bottomRow: HTMLElement,
  generation: number
) {
  const currentRequest = `${videoId}-${channelUrl}`;
  latestRequest = currentRequest;

  const response = await fetchVideoInfo(
    videoId,
    channelUrl,
    false,
    getLanguage()?.toLowerCase() ?? "en"
  );
  log(`video info: ${JSON.stringify(response)}`);

  if (generation !== pageGeneration || latestRequest !== currentRequest) {
    return;
  }

  // Avoid duplicate boxes, e.g. when the channel changes on collab videos.
  await removeInfo();

  if (response && (response.rules || response.info_text)) {
    addReactionInfo(bottomRow, response);
  } else {
    log("no rules found for this video");
    addOriginalVideoOnly(bottomRow);
  }
}

async function processCurrentPage(): Promise<void> {
  // Check if the current page is a watch page
  if (!window.location.href.includes("watch")) {
    stopPageObserver();
    return;
  }

  log("video detected!");

  // Get video id
  const videoId = new URL(window.location.href).searchParams.get("v");
  if (!videoId) {
    log("video id not found");
    return;
  }
  log("video id: " + videoId);

  const reactionInfoExists = document.querySelector(REACTION_INFO_SELECTOR);

  if (hasProcessed && currentVideoId === videoId && reactionInfoExists) {
    log("video already processed, skipping setup");
    ensureSettingsMounted();
    return;
  }

  stopPageObserver();
  const generation = ++pageGeneration;

  await removeInfo();
  await removeTosSegments();
  currentVideoId = videoId;
  resetSettingsMountCount();

  let tosHandled = false;
  let guidelinesHandled = false;
  let settingsMounted = false;
  let checkRunning = false;

  const isStale = () => generation !== pageGeneration;

  const check = async () => {
    if (isStale() || checkRunning) return;
    checkRunning = true;

    try {
      settingsMounted = ensureSettingsMounted();

      // TOS segments are inserted into the progress bar. That insertion is a
      // DOM mutation itself, so it must only happen once per video.
      if (!tosHandled && document.querySelector(".ytp-progress-bar")) {
        tosHandled = true;
        addTosSegments(videoId)
          .then(() => log("tos segments added"))
          .catch((e) => log("error adding tos segments: " + e));
      }

      if (!guidelinesHandled) {
        const bottomRow = document.querySelector<HTMLElement>("#bottom-row");
        const channelUrl = bottomRow ? await getChannelUrl() : null;

        if (isStale()) return;

        if (bottomRow && channelUrl) {
          guidelinesHandled = true;
          hasProcessed = true;
          currentChannelUrl = channelUrl;
          log("channel url: " + channelUrl);

          observeChannelNameChange(videoId, generation);
          await renderGuidelines(videoId, channelUrl, bottomRow, generation);
        }
      }

      if (tosHandled && guidelinesHandled && settingsMounted) {
        log("page setup complete");
        stopPageObserver();
      }
    } finally {
      checkRunning = false;
    }
  };

  // Throttle: run the check at most once per PAGE_CHECK_THROTTLE_MS,
  // no matter how many mutations YouTube produces.
  const scheduleCheck = () => {
    if (pageCheckTimeout !== null) return;
    pageCheckTimeout = setTimeout(() => {
      pageCheckTimeout = null;
      check();
    }, PAGE_CHECK_THROTTLE_MS);
  };

  pageObserver = new MutationObserver(scheduleCheck);
  pageObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  pageSetupDeadline = setTimeout(() => {
    if (isStale()) return;
    log("page setup timed out, stop observing");
    stopPageObserver();

    // Channel could not be detected: still show the original video, if any.
    const bottomRow = document.querySelector<HTMLElement>("#bottom-row");
    if (
      !guidelinesHandled &&
      bottomRow &&
      !document.querySelector(REACTION_INFO_SELECTOR)
    ) {
      addOriginalVideoOnly(bottomRow);
    }
  }, PAGE_SETUP_TIMEOUT_MS);

  await check();
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

async function observeChannelNameChange(videoId: string, generation: number) {
  log("observing channel name change");
  currentChannelNameObserver?.disconnect();

  let running = false;

  const observer = new MutationObserver(async (_, obs) => {
    if (generation !== pageGeneration) {
      obs.disconnect();
      return;
    }
    if (running) return;
    running = true;

    try {
      const channelUrl = await getChannelUrl();
      const bottomRow: HTMLElement | null =
        document.querySelector("#bottom-row");

      if (!bottomRow || !channelUrl || channelUrl === currentChannelUrl) {
        return;
      }

      obs.disconnect(); // Stop observing after the change is handled
      currentChannelUrl = channelUrl;
      log("channel url changed: " + channelUrl);
      hasProcessed = true;

      await renderGuidelines(videoId, channelUrl, bottomRow, generation);
    } finally {
      running = false;
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

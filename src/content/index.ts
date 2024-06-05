import { isProduction, log } from './utils';
import { handleThumbnails } from './utils/thumbnails';
import { fetchVideoInfo } from './utils/api';
import { getChannelUrl } from './utils/youtube';
import { addReactionInfo, removeInfo } from './components/reaction-info';
import { removeAllThumbnailInfos } from './components/thumbnail-info';
import browser from "webextension-polyfill";
import { getLanguage } from './utils/language';

export let API_URL = "https://api.canireact.com";
export let hasProcessed = false;
export let currentChannelUrl: string | null = null;

let currentChannelNameObserver: MutationObserver | null = null;
let latestRequest: string | null = null;

async function main() {
    const isProd = isProduction();
    log("main.js loaded!");
    log(`environment: ${isProd ? "production" : "development"}`);

    let port = browser.runtime.connect();
    port.postMessage({ message: "hello" });

    await processCurrentPage();
    await registerThumbnailObserver();

    document.addEventListener("yt-navigate-finish", async function () {
        log("switched page, processing...");

        await removeInfo();
        currentChannelNameObserver?.disconnect();
        await processCurrentPage();
        await removeAllThumbnailInfos();
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

        // Wait for the bottom row to be available in the DOM
        const observer = new MutationObserver(async (_, obs) => {
            const channelUrl = await getChannelUrl();
            currentChannelUrl = channelUrl;
            log("channel url: " + channelUrl);

            if (hasProcessed && currentChannelUrl === channelUrl) {
                obs.disconnect();
                return; // Exit if already processed
            }

            const bottomRow: HTMLElement | null = document.querySelector("#bottom-row");
            if (bottomRow && channelUrl) {
                hasProcessed = true;

                observeChannelNameChange(videoId);

                const currentRequest = `${videoId}-${channelUrl}`;
                latestRequest = currentRequest;

                // Fetch video info
                const response = await fetchVideoInfo(videoId, channelUrl, false, getLanguage()?.toLowerCase() ?? "en");
                log(`video info: ${JSON.stringify(response)}`);

                if (latestRequest !== currentRequest) {
                    obs.disconnect();
                    return;
                }

                if (response && (response.rules || response.info_text)) {
                    addReactionInfo(bottomRow, response);
                } else {
                    log("no rules found for this video");
                    removeInfo();
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
            }

            obs.disconnect(); // Stop observing after the element is found and handled
        }
    });

    const channelNameEl = document.querySelector("#above-the-fold ytd-channel-name yt-formatted-string a");

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
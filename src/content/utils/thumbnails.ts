import { log } from ".";
import { addThumbnailReactionInfo } from "../components/thumbnail-info";
import { fetchVideoInfo } from "./api";

export const handledThumbnails = new Set<HTMLElement>();

export async function getThumbnails(): Promise<NodeListOf<HTMLElement>> {
    return document.querySelectorAll("ytd-rich-item-renderer.style-scope.ytd-rich-grid-row, ytd-video-renderer.style-scope");
}

export async function handleThumbnails(): Promise<void> {
    const thumbnails = await getThumbnails();

    thumbnails.forEach(async thumbnail => {
        if (handledThumbnails.has(thumbnail)) {
            return;
        }
        try {
            handledThumbnails.add(thumbnail);

            const channelLinkElement: HTMLAnchorElement | null = thumbnail.querySelector("#content ytd-rich-grid-media #dismissible #details #avatar-link, ytd-channel-name .ytd-channel-name yt-formatted-string a.yt-simple-endpoint");
            const channelUrl = channelLinkElement ? channelLinkElement.href : null;

            const thumbnailLinkElement: HTMLAnchorElement | null = thumbnail.querySelector("#content ytd-rich-grid-media #dismissible #details #meta #title, #video-title-link, #dismissible ytd-thumbnail #thumbnail");

            const videoId = thumbnailLinkElement ? new URL(thumbnailLinkElement.href).searchParams.get("v") : null;

            if (videoId === null || channelUrl === null) {
                log("video id or channel not found");
                return;
            }

            const response = await fetchVideoInfo(videoId, channelUrl, true);

            if (response) {
                addThumbnailReactionInfo(thumbnail, response);
            }
        } catch (e) {
            log("error handling thumbnail: " + e);
        }
    });
}
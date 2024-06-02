import { Guidelines } from "../utils/api";
import { getLanguageString } from "../utils/language";
import { getThumbnails, handledThumbnails } from "../utils/thumbnails";

export async function addThumbnailReactionInfo(thumbnail: HTMLElement, response: Guidelines): Promise<void> {
    if (!thumbnail || !response) {
        return;
    }

    const metadata = thumbnail.querySelector("#metadata, #channel-info");

    if (!metadata) {
        return;
    }

    // remove existing info
    const existingReactionInfo = thumbnail.querySelector("#reaction-thumbnail-info");

    if (existingReactionInfo) {
        existingReactionInfo.remove();
    }

    const reactionInfo = document.createElement("div");
    reactionInfo.id = "reaction-thumbnail-info";
    reactionInfo.className = `reaction-thumbnail-info ${response.info_text ? "" : response.rules?.stream.stream_reactions_allowed ? "reaction-info-success" : "reaction-info-error"}`;
    reactionInfo.innerText = response.info_text ? "ℹ️" : response.rules?.stream.stream_reactions_allowed ? `✔ ${await getLanguageString("short_stream_reactions_allowed")}` : `✘ ${await getLanguageString("short_stream_reactions_not_allowed")}`;

    if (response.info_text) {
        reactionInfo.title = response.info_text;
    }

    metadata.appendChild(reactionInfo);
}

export async function removeAllThumbnailInfos(): Promise<void> {
    const thumbnails = await getThumbnails();

    thumbnails.forEach(thumbnail => {
        const reactionInfo = thumbnail.querySelector("#reaction-thumbnail-info");
        if (reactionInfo) {
            reactionInfo.remove();
        }
    });

    handledThumbnails.clear();
}
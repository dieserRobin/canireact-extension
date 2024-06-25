import { hasTimeElapsed } from "../utils";
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

    const container = document.createElement("div");
    container.classList.add("reaction-thumbnail-info-container");

    // remove existing info
    const existingReactionInfo = thumbnail.querySelector(".reaction-thumbnail-info-container");

    if (existingReactionInfo) {
        existingReactionInfo.remove();
    }

    if (response.rules?.stream.stream_reaction_allowed_after_hours && response.rules?.stream.stream_reactions_allowed === false && response.video) {
        const timeElapsed = hasTimeElapsed(response.video.uploaded_at, response.rules.stream.stream_reaction_allowed_after_hours);
        if (timeElapsed) {
            response.rules.stream.stream_reactions_allowed = response.rules.stream.stream_reactions_generally_allowed;
        }
    }

    const reactionInfo = document.createElement("div");
    reactionInfo.id = "reaction-thumbnail-info";
    reactionInfo.className = `reaction-thumbnail-info ${response.info_text ? "" : response.rules?.stream.stream_reactions_allowed ? "reaction-info-success" : "reaction-info-error"}`;
    reactionInfo.innerText = response.info_text ? "ℹ️" : response.rules?.stream.stream_reactions_allowed ? `✔ ${await getLanguageString("short_stream_reactions_allowed")}` : `✘ ${await getLanguageString("short_stream_reactions_not_allowed")}`;

    if (response.info_text) {
        reactionInfo.title = response.info_text;
    }

    container.appendChild(reactionInfo);

    if (response.original_video) {
        // create a link to the original video beside the reaction info
        const originalVideoLink = document.createElement("a");
        originalVideoLink.href = response.original_video;
        originalVideoLink.innerText = "🔗 Original video";
        originalVideoLink.target = "_blank";
        originalVideoLink.rel = "noopener noreferrer";
        originalVideoLink.title = "Original video";
        originalVideoLink.className = "reaction-thumbnail-info-link";
        container.appendChild(originalVideoLink);
    }

    metadata.appendChild(container);
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
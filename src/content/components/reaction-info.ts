import { collapseState } from "..";
import { hasTimeElapsed, isSponsorBlockInstalled, log } from "../utils";
import { Guidelines, fetchVideoDetails } from "../utils/api";
import { getLanguageString } from "../utils/language";
import { createImageElement, createTextElement } from "../utils/render";
import browser from "webextension-polyfill";
import { getOriginalVideo } from "../utils/youtube";
import { displaySponsorInfo, stopSponsorInfo } from "./sponsor-info";
import ReactionInfo from "./reaction-guidelines";

let videoCountdownInterval: NodeJS.Timeout | null = null;
let streamCountdownInterval: NodeJS.Timeout | null = null;

let reactionInfoComponent: ReactionInfo | null = null;

export async function removeInfo(): Promise<void> {
  reactionInfoComponent && reactionInfoComponent.destroy();
  const reactionInfo = document.querySelector("#reaction-info");
  stopSponsorInfo();
  videoCountdownInterval && clearInterval(videoCountdownInterval);
  streamCountdownInterval && clearInterval(streamCountdownInterval);
  if (reactionInfo) {
    reactionInfo.remove();
  }
}

export async function addReactionInfo(
  bottomRow: HTMLElement,
  response: Guidelines,
  isRedesign?: boolean
): Promise<void> {
  if (response.video) {
    if (
      response.rules?.video.video_reaction_allowed_after_hours &&
      response.rules?.video.video_reactions_allowed === false
    ) {
      // The key was temporarily named stream_reaction_allowed_after_hours and those responses may be cached, so we need to check for both
      const timeElapsed = hasTimeElapsed(
        response.video.uploaded_at,
        response.rules.video.video_reaction_allowed_after_hours
      );
      if (timeElapsed)
        response.rules.video.video_reactions_allowed =
          response.rules.video.stream_reactions_generally_allowed ??
          response.rules.video.video_reactions_generally_allowed;
    }

    if (
      response.rules?.stream.stream_reaction_allowed_after_hours &&
      response.rules?.stream.stream_reactions_allowed === false
    ) {
      const timeElapsed = hasTimeElapsed(
        response.video.uploaded_at,
        response.rules.stream.stream_reaction_allowed_after_hours
      );
      if (timeElapsed)
        response.rules.stream.stream_reactions_allowed =
          response.rules.stream.stream_reactions_generally_allowed;
    }
  }

  if (
    response.rules?.stream.sponsor_skips_allowed === false &&
    (response.sponsor_segments?.length ?? 0) > 0
  ) {
    displaySponsorInfo(response.sponsor_segments ?? []);
  }

  reactionInfoComponent = new ReactionInfo(bottomRow, response, collapseState);
}

async function displayOriginalVideo(
  originalVideoId: string,
  originalVideo: HTMLAnchorElement
): Promise<void> {
  const videoData = await fetchVideoDetails(originalVideoId);
  log("Video data: ", videoData);

  if (!videoData) return;

  originalVideo.classList.add("reaction-info-original-video");

  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.classList.add("reaction-info-original-video-thumbnail");
  const thumbnail = document.createElement("img");
  thumbnail.src = videoData.thumbnail;
  thumbnail.alt = videoData.title;
  thumbnailContainer.appendChild(thumbnail);

  const textContainer = document.createElement("div");

  const title = document.createElement("p");
  title.textContent = videoData.title;
  title.classList.add("reaction-info-original-video-title");

  const channel = document.createElement("p");
  channel.textContent = videoData.channelName;
  channel.classList.add("reaction-info-original-video-channel");

  textContainer.appendChild(title);
  textContainer.appendChild(channel);

  originalVideo.href = `https://www.youtube.com/watch?v=${originalVideoId}`;

  originalVideo.appendChild(thumbnailContainer);
  originalVideo.appendChild(textContainer);
}

export async function addOriginalVideoOnly(bottomRow: HTMLElement) {
  const originalVideo = await getOriginalVideo();
  const originalVideoId = originalVideo?.split("v=")[1];
  if (!originalVideoId) return;

  const reactionInfo = document.createElement("div");
  const detailedInfo = document.createElement("div");

  const elements = [];

  reactionInfo.id = "reaction-info";
  reactionInfo.className =
    "item style-scope ytd-watch-metadata rounded-large full-w";

  reactionInfo.classList.add("gray");

  elements.push(
    createTextElement(
      "p",
      "reaction-info-secondary font-bold",
      "Original Video"
    )
  );

  const originalVideoElement = document.createElement("a");
  await displayOriginalVideo(originalVideoId, originalVideoElement);
  elements.push(originalVideoElement);

  const lightSrc = browser.runtime.getURL("images/canireact_source-light.svg");
  const darkSrc = browser.runtime.getURL("images/canireact_source.svg");

  elements.push(
    createImageElement(
      lightSrc,
      "Can I React?",
      "reaction-info-source light-version"
    )
  );
  elements.push(
    createImageElement(
      darkSrc,
      "Can I React?",
      "reaction-info-source dark-version"
    )
  );

  elements.forEach((el) => detailedInfo.appendChild(el));
  reactionInfo.appendChild(detailedInfo);

  bottomRow.parentNode?.insertBefore(reactionInfo, bottomRow);
}

import { collapseState, reactionInfoMinimized } from "..";
import { hasTimeElapsed, log } from "../utils";
import { Guidelines, fetchSegments, fetchVideoDetails } from "../utils/api";
import { createImageElement, createTextElement } from "../utils/render";
import browser from "webextension-polyfill";
import { getOriginalVideo, getVideoId } from "../utils/youtube";
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

function calculateRemainingTime(upload: string, hours: number) {
  const uploadDate = new Date(upload);
  const currentDate = new Date();
  const timeElapsed = currentDate.getTime() - uploadDate.getTime();
  const remainingTime = hours * 3600000 - timeElapsed;
  return remainingTime;
}

async function adjustSettingsBorder(theme: "green" | "orange" | "red") {
  const button = document.querySelector("#cir-settings-button");
  if (!button) return;

  switch (theme) {
    case "green":
      button.classList.add("cir-guideline-green");
      break;
    case "orange":
      button.classList.add("cir-guideline-orange");
      break;
    case "red":
      button.classList.add("cir-guideline-red");
      break;
    default:
      break;
  }
}

export async function addReactionInfo(
  bottomRow: HTMLElement,
  response: Guidelines,
  isRedesign?: boolean
): Promise<void> {
  adjustSettingsBorder(
    response.rules.stream.stream_reactions_allowed &&
      response.rules.video.video_reactions_allowed
      ? "green"
      : response.rules.stream.stream_reactions_allowed
        ? "orange"
        : "red"
  );

  if (reactionInfoMinimized) return;

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

  const tosSegments = await fetchSegments(getVideoId(window.location.href));

  displaySponsorInfo(
    response.rules.stream.sponsor_skips_allowed === false
      ? response.sponsor_segments ?? []
      : [],
    tosSegments?.filter((t) => t.votes >= 5).map((t) => [t.start, t.end]) ?? []
  );

  reactionInfoComponent = new ReactionInfo(bottomRow, response, collapseState);

  if (
    response.rules.stream.stream_reaction_allowed_after_hours &&
    !response.rules.stream.stream_reactions_allowed
  ) {
    const remainingTime = calculateRemainingTime(
      response.video.uploaded_at,
      response.rules.stream.stream_reaction_allowed_after_hours
    );
    streamCountdownInterval = setTimeout(async () => {
      response.rules.stream.stream_reactions_allowed =
        response.rules.stream.stream_reactions_generally_allowed;
      reactionInfoComponent?.destroy();
      reactionInfoComponent = new ReactionInfo(
        bottomRow,
        response,
        collapseState
      );
    }, remainingTime);
  }

  if (
    response.rules.video.video_reaction_allowed_after_hours &&
    !response.rules.video.video_reactions_allowed
  ) {
    const remainingTime = calculateRemainingTime(
      response.video.uploaded_at,
      response.rules.video.video_reaction_allowed_after_hours
    );
    videoCountdownInterval = setTimeout(async () => {
      response.rules.video.video_reactions_allowed =
        response.rules.video.video_reactions_generally_allowed;
      reactionInfoComponent?.destroy();
      reactionInfoComponent = new ReactionInfo(
        bottomRow,
        response,
        collapseState
      );
    }, remainingTime);
  }
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

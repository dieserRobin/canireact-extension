import { log } from ".";

export function getVideoId(url: string) {
  const videoId = url.match(
    /https:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})|https:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/i
  );
  return videoId ? videoId[2] || videoId[3] : null;
}

export async function getChannelUrl(): Promise<string | null> {
  const selectorCandidates = [
    "#above-the-fold ytd-channel-name yt-formatted-string a[href]",
    "#owner ytd-video-owner-renderer a[href]",
    'span[itemprop="name"] link[itemprop="url"]',
    "a.yt-core-attributed-string__link[href]",
    "ytd-video-description-infocards-section-renderer a#header[href]",
  ];

  for (const selector of selectorCandidates) {
    const link = document.querySelector<HTMLAnchorElement>(selector);
    if (!link?.href || link.href.toLowerCase().startsWith("javascript")) {
      continue;
    }

    if (link.href.startsWith("/")) {
      return `https://www.youtube.com${link.getAttribute("href")}`;
    }

    return link.href;
  }

  const fallbackChannelId =
    (window as any)?.ytInitialPlayerResponse?.videoDetails?.channelId ??
    (window as any)?.ytplayer?.config?.args?.ucid;

  if (fallbackChannelId) {
    return `https://www.youtube.com/channel/${fallbackChannelId}`;
  }

  return null;
}

const YOUTUBE_VIDEO_LINK =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^\s]*?&)?v=|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;

// Words that indicate that a link points to the reacted-to (original) video.
// Plain "video" is intentionally not included: descriptions often contain
// lines like "Mein neues Video: <link>" which are self-promotion (issue #11).
const ORIGINAL_VIDEO_KEYWORDS =
  /(original|orginal|quelle|source|credit|reaction to|reacting to|reacted to|reaktion auf|react auf|reagiere auf|reagieren auf|video von|video by|video from)/i;

// "@handle - <link>" or "@handle: <link>"
const HANDLE_PREFIX = /@[\w.-]+\s*[-–:|]\s*\S*$/;

/**
 * Finds the original (reacted-to) video in a video description.
 * A link only counts if its line - or the line above - mentions it as
 * original/source, or if it directly follows an "@handle -" prefix.
 */
export function findOriginalVideoId(
  description: string,
  currentVideoId?: string | null
): string | null {
  const lines = description.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const previousLine = i > 0 ? lines[i - 1] : "";

    YOUTUBE_VIDEO_LINK.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = YOUTUBE_VIDEO_LINK.exec(line)) !== null) {
      const videoId = match[1];
      if (videoId === currentVideoId) continue;

      const textBeforeLink = line.slice(0, match.index);
      const previousLineHasNoLink = !/https?:\/\//i.test(previousLine);

      if (
        ORIGINAL_VIDEO_KEYWORDS.test(textBeforeLink) ||
        HANDLE_PREFIX.test(textBeforeLink) ||
        // Keyword on its own line, link on the next one
        (textBeforeLink.trim() === "" &&
          previousLineHasNoLink &&
          ORIGINAL_VIDEO_KEYWORDS.test(previousLine))
      ) {
        return videoId;
      }
    }
  }

  return null;
}

export async function getOriginalVideo(): Promise<string | null> {
  const context = document.querySelector(
    "#microformat > player-microformat-renderer > script"
  );
  if (!context) return null;

  let description: string | undefined;
  try {
    // context is a script tag with JSON data
    description = JSON.parse(context.innerHTML)?.description;
  } catch (e) {
    log("could not parse video microformat", e);
    return null;
  }

  if (!description) return null;

  const currentVideoId = new URL(window.location.href).searchParams.get("v");
  const videoId = findOriginalVideoId(description, currentVideoId);

  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

export function getCurrentChannelName(): string | null {
  const channelName = document.querySelector(
    "#above-the-fold ytd-channel-name yt-formatted-string a, #owner ytd-channel-name a"
  );
  return channelName?.textContent?.trim() || null;
}

export function getVideo(): HTMLVideoElement | null {
  return document.querySelector(".html5-main-video");
}

export function skipTo(time: number) {
  const video = getVideo();
  if (video) video.currentTime = time;
}

export async function getCurrentTime() {
  const video = getVideo();
  return video ? video.currentTime : null;
}

export async function getVideoLength() {
  const videoDuration = document.querySelector(".ytp-time-duration");
  if (!videoDuration) return null;

  const duration = videoDuration.textContent;
  const durationArray = duration?.split(":");
  if (!durationArray) return null;

  let seconds = 0;

  for (let i = 0; i < durationArray.length; i++) {
    seconds +=
      parseInt(durationArray[i]) * Math.pow(60, durationArray.length - i - 1);
  }

  return seconds;
}

export function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${hours > 0 ? hours + ":" : ""}${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

export async function getYouTubePlayer() {
  return document.querySelector(".ytd-player");
}

export async function getProgressBar() {
  return document.querySelector(
    ".ytp-progress-bar-container .ytp-progress-bar"
  );
}

export async function getMoreDropdown() {
  return document.querySelector("#items");
}

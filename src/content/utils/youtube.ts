export function getVideoId(url: string) {
  const videoId = url.match(
    /https:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})|https:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/i
  );
  return videoId ? videoId[2] || videoId[3] : null;
}

export async function getChannelUrl(): Promise<string | null> {
  const channelLink =
    document.querySelector<HTMLAnchorElement>(
      "#above-the-fold ytd-channel-name yt-formatted-string a"
    ) ||
    document.querySelector<HTMLAnchorElement>(
      'span[itemprop="name"] link[itemprop="url"]'
    );
  return channelLink ? channelLink.href : null;
}

export async function getOriginalVideo(): Promise<string | null> {
  const context = document.querySelector(
    "#microformat > player-microformat-renderer > script"
  );
  if (!context) return null;

  // context is a script tag with JSON data
  const data = JSON.parse(context.innerHTML);
  const description = data.description;

  if (!description) return null;

  // Match the link and check for "original", "video" or "@handle - " in the same line or the line before
  const match = description.match(
    /(^|\n).*((original|video).*\n?.*|@[\w-]+ -?).*(https:\/\/www\.youtube\.com\/watch\?v=|https:\/\/youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );

  return match ? `https://www.youtube.com/watch?v=${match[5]}` : null;
}

export function getVideo(): HTMLVideoElement | null {
  return document.querySelector(".html5-main-video");
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

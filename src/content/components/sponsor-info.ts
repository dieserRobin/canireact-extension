import { log } from "../utils";
import { getLanguageString } from "../utils/language";
import { getCurrentTime, getYouTubePlayer } from "../utils/youtube";

export let timeCheckInterval: NodeJS.Timeout | null = null;
let showingInfo = false;

async function checkTime(segments: [number, number][]) {
  const currentTime = await getCurrentTime();
  if (!currentTime) return;

  let foundSegment = false;

  for (const segment of segments) {
    if (currentTime >= segment[0] && currentTime <= segment[1]) {
      log("Sponsor segment detected");
      foundSegment = true;
      showInfo();
    }
  }

  if (!foundSegment && showingInfo) {
    removeInfo();
  }
}

async function removeInfo() {
  const info = document.getElementById("sponsor-info");
  if (info) {
    info.remove();
    showingInfo = false;
  }
}

export async function displaySponsorInfo(segments: [number, number][]) {
  log("Starting sponsor info");
  timeCheckInterval = setInterval(() => checkTime(segments), 1000);
}

export async function stopSponsorInfo() {
  log("Stopping sponsor info");
  removeInfo();
  if (timeCheckInterval) {
    clearInterval(timeCheckInterval);
    timeCheckInterval = null;
  }
}

async function showInfo() {
  if (showingInfo) return;
  showingInfo = true;

  const player = await getYouTubePlayer();
  if (!player) return;

  const info = document.createElement("div");
  info.id = "sponsor-info";
  info.classList.add("sponsor-info-container");

  const title = document.createElement("h3");
  title.textContent = getLanguageString("sponsor_segment_title");

  const description = document.createElement("p");
  description.textContent = getLanguageString("sponsor_segment_description");

  info.appendChild(title);
  info.appendChild(description);

  player.appendChild(info);

  setTimeout(() => {
    removeInfo();
  }, 10_000);
}

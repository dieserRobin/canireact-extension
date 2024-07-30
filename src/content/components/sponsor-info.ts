import { sponsorRemindersActive } from "..";
import { log } from "../utils";
import { getLanguageString } from "../utils/language";
import { getCurrentTime, getYouTubePlayer } from "../utils/youtube";

export let timeCheckInterval: NodeJS.Timeout | null = null;
let showingInfo = false;
let showingTosInfo = false;
let shownSegments: [number, number][] = [];

async function checkTime(
  segments: [number, number][],
  tosSegments: [number, number][]
) {
  const currentTime = await getCurrentTime();
  if (!currentTime) return;

  let foundSegment = false;
  let foundTosSegment = false;

  for (const segment of segments) {
    if (currentTime >= segment[0] - 5 && currentTime <= segment[1]) {
      if (shownSegments.includes(segment)) return;
      shownSegments.push(segment);

      log("Sponsor segment detected");
      foundSegment = true;
      showInfo();
    }
  }

  for (const segment of tosSegments) {
    if (currentTime >= segment[0] - 10 && currentTime <= segment[1]) {
      foundTosSegment = true;
      if (shownSegments.includes(segment)) return;
      shownSegments.push(segment);

      log("TOS segment detected");
      showTosInfo();
    }
  }

  for (const shownSegment of shownSegments) {
    if (shownSegment[1] + 5 < currentTime) {
      shownSegments = shownSegments.filter(
        (segment) => segment !== shownSegment
      );
    }
  }

  if (!foundSegment && showingInfo) {
    removeInfo();
  }

  if (!foundTosSegment && showingTosInfo) {
    removeTosInfo();
  }
}

async function removeTosInfo() {
  const info = document.getElementById("tos-info");
  if (info) {
    info.remove();
    showingTosInfo = false;
  }
}

async function removeInfo() {
  const info = document.getElementById("sponsor-info");
  if (info) {
    info.remove();
    showingInfo = false;
  }
}

export async function displaySponsorInfo(
  segments: [number, number][],
  tosSegments: [number, number][]
) {
  if (!sponsorRemindersActive) return;
  log("Starting sponsor info");
  timeCheckInterval = setInterval(() => checkTime(segments, tosSegments), 1000);
}

export async function stopSponsorInfo() {
  log("Stopping sponsor info");
  removeInfo();
  removeTosInfo();
  if (timeCheckInterval) {
    clearInterval(timeCheckInterval);
    timeCheckInterval = null;
  }
}

async function showTosInfo() {
  if (showingTosInfo) return;
  showingTosInfo = true;

  const player = await getYouTubePlayer();
  if (!player) return;

  const info = document.createElement("div");
  info.id = "tos-info";
  info.classList.add("sponsor-info-container");

  const title = document.createElement("h3");
  title.textContent = getLanguageString("tos_segment_title");

  const description = document.createElement("p");
  description.textContent = getLanguageString("tos_segment_description");

  info.onclick = () => {
    info.style.display = "none";
  };

  info.appendChild(title);
  info.appendChild(description);

  player.appendChild(info);
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

  info.onclick = () => {
    info.style.display = "none";
  };

  player.appendChild(info);

  setTimeout(() => {
    removeInfo();
  }, 10_000);
}

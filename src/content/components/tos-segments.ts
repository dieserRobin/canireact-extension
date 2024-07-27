import { log } from "../utils";
import { fetchSegments } from "../utils/api";
import { getProgressBar, getVideoLength } from "../utils/youtube";

export async function addTosSegments(videoId: string) {
    await removeTosSegments();

    const segments = await fetchSegments(videoId);
    log("Segments: ", segments);

    if (segments) {
        await insertSegments(segments.map(segment => [segment.start, segment.end]));
    }
}

async function insertSegments(segments: [number, number][]) {
    const progressBar = await getProgressBar();
    if (!progressBar) return;

    const videoLength = await getVideoLength();
    if (!videoLength) return;
    log("Video length: ", videoLength);

    log("Adding TOS segments to progress bar");

    for (const [start, end] of segments) {
        const segment = document.createElement("div");
        segment.className = "reaction-info-tos-segment";

        const segmentStart = (start / videoLength) * 100;
        const segmentEnd = (end / videoLength) * 100;

        segment.style.left = `${segmentStart}%`;
        segment.style.width = `${segmentEnd - segmentStart}%`;

        progressBar.appendChild(segment);
    }
}

export async function removeTosSegments() {
    const progressBar = await getProgressBar();
    if (!progressBar) return;
    log("Removing TOS segments from progress bar");

    const segments = progressBar.querySelectorAll(".reaction-info-tos-segment");
    segments.forEach(segment => segment.remove());
}
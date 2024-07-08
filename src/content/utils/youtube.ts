export async function getChannelUrl(): Promise<string | null> {
    const channelLink = document.querySelector<HTMLAnchorElement>('#above-the-fold ytd-channel-name yt-formatted-string a')
        || document.querySelector<HTMLAnchorElement>('span[itemprop="name"] link[itemprop="url"]');
    return channelLink ? channelLink.href : null;
}

export async function getOriginalVideo(): Promise<string | null> {
    const context = document.querySelector("#microformat > player-microformat-renderer > script");
    if (!context) return null;

    // context is a script tag with JSON data
    const data = JSON.parse(context.innerHTML);
    const description = data.description;

    if (!description) return null;

    // Match the link and check for "original", "video" or "@handle - " in the same line or the line before
    const match = description.match(/(^|\n).*((original|video).*\n?.*|@[\w-]+ -?).*(https:\/\/www\.youtube\.com\/watch\?v=|https:\/\/youtu\.be\/)([a-zA-Z0-9_-]{11})/i);

    return match ? `https://www.youtube.com/watch?v=${match[5]}` : null;
}

export async function getCurrentTime() {
    const currentTime = document.querySelector(".ytp-time-current");
    if (!currentTime) return null;

    const time = currentTime.textContent;
    const timeArray = time?.split(":");
    if (!timeArray) return null;

    let seconds = 0;

    for (let i = 0; i < timeArray.length; i++) {
        seconds += parseInt(timeArray[i]) * Math.pow(60, timeArray.length - i - 1);
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
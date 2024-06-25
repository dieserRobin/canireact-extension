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

    // Match the link and check for "original" in the same line or the line before
    const match = description.match(/(^|\n).*original.*\n?.*https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i);

    return match ? `https://www.youtube.com/watch?v=${match[2]}` : null;
}

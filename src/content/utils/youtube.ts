export async function getChannelUrl(): Promise<string | null> {
    const channelLink = document.querySelector<HTMLAnchorElement>('#above-the-fold ytd-channel-name yt-formatted-string a')
        || document.querySelector<HTMLAnchorElement>('span[itemprop="name"] link[itemprop="url"]');
    return channelLink ? channelLink.href : null;
}
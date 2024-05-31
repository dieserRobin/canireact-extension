import browser from 'webextension-polyfill';
import { API_URL } from '..';
import { log } from '.';

export async function fetchVideoInfo(videoId: string, channelUrl: string | null = null, easyRequest: boolean = false, language?: string): Promise<any> {
    if (!videoId) {
        return null;
    }

    return browser.runtime.sendMessage({
        message: "sendRequest",
        url: `${API_URL}/v1/video/${videoId}?easy_request=${easyRequest ? "true" : "false"}${channelUrl ? `&channel_url=${channelUrl}` : ""}${language ? `&language=${language}` : ""}`,
        method: "GET",
        data: null,
    })
        .then(response => {
            if (response && response.success) {
                return response.data;
            } else {
                return null;
            }
        })
        .catch(error => {
            log("Error fetching video info:", error)
            return null;
        });
}

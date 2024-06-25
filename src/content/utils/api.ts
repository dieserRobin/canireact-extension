import browser from 'webextension-polyfill';
import { API_URL } from '..';
import { log } from '.';

export type Guidelines = {
    id: string;
    channel_id: string;
    rules: {
        rules_id: number;
        stream: {
            stream_reactions_allowed: boolean;
            stream_reactions_generally_allowed: boolean;
            credit_stream_chat: boolean | null;
            sponsor_skips_allowed: boolean | null;
            stream_reaction_allowed_after_hours: number | null;
            custom_rules: string[];
        };
        video: {
            video_reactions_allowed: boolean;
            video_reactions_generally_allowed: boolean;
            stream_reactions_generally_allowed?: boolean;
            monetization_allowed: boolean | null;
            sponsor_cut_allowed: boolean | null;
            reaction_video_splittling_allowed: boolean | null;
            video_reaction_allowed_after_hours: number | null;
            credit_video_description: boolean | null;
            reaction_video_includes_title: boolean | null;
            custom_rules: string[];
        };
    } | null;
    video: {
        uploaded_at: string;
    } | null;
    info_text: string | null;
    source: string;
}

export async function fetchVideoInfo(videoId: string, channelUrl: string | null = null, easyRequest: boolean = false, language?: string): Promise<any> {
    if (!videoId) {
        return null;
    }

    return browser.runtime.sendMessage({
        message: "sendRequest",
        url: `${API_URL}/v1/video/${videoId}?easy_request=${easyRequest ? "true" : "false"}${channelUrl ? `&channel_url=${encodeURIComponent(channelUrl)}` : ""}${language ? `&language=${encodeURIComponent(language)}` : ""}`,
        method: "GET",
        data: null,
    })
        .then(response => {
            if (response && response.success) {
                return response.data as Guidelines;
            } else {
                return null;
            }
        })
        .catch(error => {
            log("Error fetching video info:", error)
            return null;
        });
}

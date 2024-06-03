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
            credit_stream_chat: boolean | null;
            sponsor_skips_allowed: boolean | null;
            stream_reaction_allowed_after_hours: number | null;
            custom_rules: string[];
        };
        video: {
            video_reactions_allowed: boolean;
            monetization_allowed: boolean | null;
            sponsor_cut_allowed: boolean | null;
            reaction_video_splittling_allowed: boolean | null;
            video_reaction_allowed_after_hours: number | null;
            credit_video_description: boolean | null;
            reaction_video_includes_title: boolean | null;
            custom_rules: string[];
        };
    } | null;
    info_text: string | null;
    source: string;
}

export type GuidelineCondition = {
  // ISO 8601 Timestamp
  available_from: string;
  // ISO 8601 Timestamp
  available_until: string;
} | boolean;

export type TimedGuidelines = {
  id: string;
  channel_id: string;
  rules: {
    rules_id: number;
    stream: {
      stream_reactions_allowed: GuidelineCondition;
      credit_stream_chat: GuidelineCondition | null;
      sponsor_skips_allowed: GuidelineCondition | null;
      stream_reaction_allowed_after_hours: number | null;
      custom_rules: string[];
    };
    video: {
      video_reactions_allowed: GuidelineCondition;
      monetization_allowed: GuidelineCondition | null;
      sponsor_cut_allowed: GuidelineCondition | null;
      reaction_video_splittling_allowed: GuidelineCondition | null;
      video_reaction_allowed_after_hours: number | null;
      credit_video_description: GuidelineCondition | null;
      reaction_video_includes_title: GuidelineCondition | null;
      custom_rules: string[];
    };
  } | null;
  info_text: string | null;
  source: string;
}

function resolveGuidelineCondition(condition: GuidelineCondition): boolean {
  if (typeof condition === "boolean") {
    return condition;
  }

  const now = new Date()
  const availableFrom = new Date(condition.available_from)
  const availableUntil = new Date(condition.available_until)
  return now >= availableFrom && now <= availableUntil
}

export function resolveTimedGuideLines(guidelines: TimedGuidelines): Guidelines {
  return {
    ...guidelines,
    rules: guidelines.rules ? {
      ...guidelines.rules,
      stream: {
        ...guidelines.rules.stream,
        stream_reactions_allowed: resolveGuidelineCondition(guidelines.rules.stream.stream_reactions_allowed),
        credit_stream_chat: guidelines.rules.stream.credit_stream_chat ? resolveGuidelineCondition(guidelines.rules.stream.credit_stream_chat) : null,
        sponsor_skips_allowed: guidelines.rules.stream.sponsor_skips_allowed ? resolveGuidelineCondition(guidelines.rules.stream.sponsor_skips_allowed) : null,
      },
      video: {
        ...guidelines.rules.video,
        video_reactions_allowed: resolveGuidelineCondition(guidelines.rules.video.video_reactions_allowed),
        monetization_allowed: guidelines.rules.video.monetization_allowed ? resolveGuidelineCondition(guidelines.rules.video.monetization_allowed) : null,
        sponsor_cut_allowed: guidelines.rules.video.sponsor_cut_allowed ? resolveGuidelineCondition(guidelines.rules.video.sponsor_cut_allowed) : null,
        reaction_video_splittling_allowed: guidelines.rules.video.reaction_video_splittling_allowed ? resolveGuidelineCondition(guidelines.rules.video.reaction_video_splittling_allowed) : null,
        credit_video_description: guidelines.rules.video.credit_video_description ? resolveGuidelineCondition(guidelines.rules.video.credit_video_description) : null,
        reaction_video_includes_title: guidelines.rules.video.reaction_video_includes_title ? resolveGuidelineCondition(guidelines.rules.video.reaction_video_includes_title) : null,
      },
    } : null,
  }
}

export async function fetchVideoInfo(videoId: string, channelUrl: string | null = null, easyRequest: boolean = false, language?: string): Promise<any> {
    if (!videoId) {
        return null;
    }

    return browser.runtime.sendMessage({
        message: "sendRequest",
        url: `${API_URL}/v2/video/${videoId}?easy_request=${easyRequest ? "true" : "false"}${channelUrl ? `&channel_url=${encodeURIComponent(channelUrl)}` : ""}${language ? `&language=${encodeURIComponent(language)}` : ""}`,
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

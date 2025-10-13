import browser from "webextension-polyfill";
import { API_URL } from "..";
import { log } from ".";

type RuntimeResponse<T> =
  | {
      success?: boolean;
      data?: T;
    }
  | null
  | undefined;

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
  sponsor_segments?: [number, number][] | null;
  original_video?: string | null;
  info_text: string | null;
  tos_segments?: TosSegment[];
  source: string;
};

export type VideoDetails = {
  title: string;
  channelName: string;
  publishedAt: string;
  thumbnail: string;
};

export type TosSegment = {
  id: string;
  videoId: string;
  start: number;
  end: number;
  category?: string;
  user: string;
  votes: number;
};

export type ReactionVideo = {
  id: string;
  title: string;
  duration: {
    text: string;
    seconds: number;
  };
  views?: number;
  thumbnail: string;
  author: {
    name: string;
    profile_picture: string;
    is_verfied?: boolean;
    channel_url: string;
  };
};

export async function fetchVideoInfo(
  videoId: string,
  channelUrl: string | null = null,
  easyRequest: boolean = false,
  language?: string
): Promise<Guidelines | null> {
  if (!videoId || !channelUrl) {
    return null;
  }

  return browser.runtime
    .sendMessage({
      message: "sendRequest",
      url: `${API_URL}/v1/video/${videoId}?easy_request=${easyRequest ? "true" : "false"}&return_original=true&return_sponsor_segments=true${channelUrl ? `&channel_url=${encodeURIComponent(channelUrl)}` : ""}${language ? `&language=${encodeURIComponent(language)}` : ""}`,
      method: "GET",
      data: null,
      priority: easyRequest ? "low" : "high",
    })
    .then((response: RuntimeResponse<Guidelines>): Guidelines | null => {
      if (response?.data) {
        return response.data;
      } else {
        return null;
      }
    })
    .catch((error: unknown): Guidelines | null => {
      log("Error fetching video info:", error);
      return null;
    });
}

export async function fetchVideoDetails(
  videoId: string
): Promise<VideoDetails | null> {
  if (!videoId) return null;

  return browser.runtime
    .sendMessage({
      message: "sendRequest",
      url: `${API_URL}/v1/video/${videoId}/details`,
      method: "GET",
      data: null,
    })
    .then((response: RuntimeResponse<VideoDetails>): VideoDetails | null => {
      if (response?.success && response.data) {
        return response.data;
      } else {
        return null;
      }
    })
    .catch((error: unknown): VideoDetails | null => {
      log("Error fetching video details:", error);
      return null;
    });
}

export async function fetchReactions(
  videoId: string
): Promise<ReactionVideo[] | null> {
  if (!videoId) return null;

  return browser.runtime
    .sendMessage({
      message: "sendRequest",
      url: `${API_URL}/v1/video/${videoId}/reactions`,
      method: "GET",
      data: null,
    })
    .then(
      (response: RuntimeResponse<ReactionVideo[]>): ReactionVideo[] | null => {
        if (response?.success && response.data) {
          return response.data;
        } else {
          return null;
        }
      }
    )
    .catch((error: unknown): ReactionVideo[] | null => {
      log("Error fetching reactions:", error);
      return null;
    });
}

export async function fetchSegments(
  videoId: string
): Promise<TosSegment[] | null> {
  if (!videoId) return null;

  return browser.runtime
    .sendMessage({
      message: "sendRequest",
      url: `${API_URL}/v1/video/${videoId}/tos`,
      method: "GET",
      data: null,
    })
    .then((response: RuntimeResponse<TosSegment[]>): TosSegment[] | null => {
      if (response?.success && response.data) {
        return response.data;
      } else {
        return null;
      }
    })
    .catch((error: unknown): TosSegment[] | null => {
      log("Error fetching segments:", error);
      return null;
    });
}

export async function submitSegment(
  videoId: string,
  segment: { start: number; end: number; category: string }
) {
  if (!videoId) return null;

  return browser.runtime
    .sendMessage({
      message: "sendRequest",
      url: `${API_URL}/v1/tos/video/${videoId}`,
      method: "POST",
      data: {
        start: segment.start,
        end: segment.end,
        category: segment.category,
      },
    })
    .then(
      async (
        response: RuntimeResponse<{ success: boolean }>
      ): Promise<{ success: boolean } | null> => {
        if (response?.success && response.data) {
          await invalidateCache(`${API_URL}/v1/video/${videoId}/tos`);
          return response.data;
        } else {
          return null;
        }
      }
    )
    .catch((error: unknown): Promise<{ success: boolean } | null> => {
      log("Error submitting segments:", error);
      return Promise.resolve(null);
    });
}

export async function rateSegment(
  segmentId: string,
  type: "UPVOTE" | "DOWNVOTE"
) {
  if (!segmentId) return null;

  return browser.runtime
    .sendMessage({
      message: "sendRequest",
      url: `${API_URL}/v1/tos/segment/${segmentId}/${type.toLowerCase()}`,
      method: "POST",
      data: { type },
    })
    .then(
      async (
        response: RuntimeResponse<{ success: boolean }>
      ): Promise<{ success: boolean } | null> => {
        if (response?.success && response.data) {
          return response.data;
        } else {
          return null;
        }
      }
    )
    .catch((error: unknown): Promise<{ success: boolean } | null> => {
      log("Error rating segment:", error);
      return Promise.resolve(null);
    });
}

export async function invalidateCache(url: string) {
  if (!url) return null;

  return browser.runtime.sendMessage({
    message: "invalidateCache",
    url,
  });
}

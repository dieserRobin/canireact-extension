import React, { useMemo, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { fetchVideoDetails, type Guidelines } from "../utils/api";
import { cn } from "../utils";
import {
  Check,
  Info,
  OctagonAlert,
  RadioTower,
  Video,
  XIcon,
} from "lucide-react";
import { getLanguageString } from "../utils/language";
import Countdown from "./countdown";
import browser from "webextension-polyfill";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { getVideoId } from "../utils/youtube";

type Props = {
  guidelines: Guidelines;
  defaultOpen: boolean;
};

const ReactionInfoComponent: React.FC<Props> = ({
  defaultOpen,
  guidelines,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const originalVideoMetadata = useQuery({
    queryKey: ["videoDetails", guidelines.original_video],
    enabled: !!guidelines.original_video,
    queryFn: () => fetchVideoDetails(getVideoId(guidelines.original_video)),
  });

  const streamReactionCountdownEnd = useMemo(
    () =>
      guidelines.video?.uploaded_at &&
      new Date(
        new Date(guidelines.video.uploaded_at).getTime() +
          guidelines.rules.stream.stream_reaction_allowed_after_hours *
            60 *
            60 *
            1000
      ),
    [guidelines]
  );
  const videoReactionCountdownEnd = useMemo(
    () =>
      guidelines.video?.uploaded_at &&
      new Date(
        new Date(guidelines.video.uploaded_at).getTime() +
          guidelines.rules.video.video_reaction_allowed_after_hours *
            60 *
            60 *
            1000
      ),
    [guidelines]
  );

  const hasStreamRestrictions =
    guidelines.rules.stream.custom_rules.length > 0 ||
    guidelines.rules.stream.sponsor_skips_allowed === false ||
    guidelines.rules.stream.credit_stream_chat;

  const hasVideoRestrictions =
    guidelines.rules.video.custom_rules.length > 0 ||
    guidelines.rules.video.sponsor_cut_allowed === false ||
    guidelines.rules.video.credit_video_description ||
    guidelines.rules.video.reaction_video_includes_title ||
    guidelines.rules.video.monetization_allowed === false ||
    guidelines.rules.video.reaction_video_splittling_allowed === false;

  const hasRestrictions = hasStreamRestrictions || hasVideoRestrictions;

  const infoTheme =
    guidelines.rules.stream.stream_reactions_allowed &&
    guidelines.rules.video.video_reactions_allowed
      ? "green"
      : guidelines.rules.stream.stream_reactions_allowed
        ? "orange"
        : "red";

  const cirIconSrc = browser.runtime.getURL("images/round-icon.svg");

  const lightStreamfinitySrc = browser.runtime.getURL(
    "images/streamfinity_source-light.svg"
  );
  const darkStreamfinitySrc = browser.runtime.getURL(
    "images/streamfinity_source.svg"
  );

  const lightCIRSrc = browser.runtime.getURL(
    "images/canireact_source-light.svg"
  );
  const darkCIRSrc = browser.runtime.getURL("images/canireact_source.svg");

  const toggleOpen = () => {
    browser.runtime.sendMessage({
      message: "setCollapseState",
      data: !open,
    });
    setOpen(!open);
  };

  return (
    <div
      id="reaction-info"
      className={cn(
        "cir-font-sans",
        infoTheme === "green" && "green",
        infoTheme === "orange" && "orange",
        infoTheme === "red" && "red"
      )}
    >
      <button
        className={cn(
          "cir-absolute cir-right-2 cir-top-3 cir-p-0 cir-bg-black/25 cir-rounded-full cir-aspect-square cir-size-12 cir-text-white cir-transition-transform cir-cursor-pointer cir-flex cir-justify-center cir-items-center",
          !open && "closed"
        )}
        onClick={toggleOpen}
      >
        <XIcon size={20} />
      </button>

      <div className="cir-flex cir-gap-2 cir-items-center cir-flex-wrap cir-w-[90%]">
        <img
          src={cirIconSrc}
          alt="Can I React?"
          className="cir-w-14"
          draggable={false}
        />

        {guidelines.rules.stream.stream_reactions_allowed ? (
          <div className="cir-bg-green-500 border cir-border-green-600 cir-px-2 cir-py-1 cir-rounded-full cir-text-2xl cir-flex cir-gap-2 cir-items-center cir-pr-3 cir-font-bold cir-text-black">
            <Check />
            {getLanguageString("stream_reactions_allowed")}
          </div>
        ) : guidelines.rules.stream.stream_reaction_allowed_after_hours ? (
          <>
            <div className="cir-bg-orange-500 border cir-border-orange-600 cir-px-2 cir-py-1 cir-rounded-full cir-text-2xl cir-flex cir-gap-2 cir-items-center cir-pr-3 cir-font-bold cir-text-black">
              <OctagonAlert />
              {getLanguageString("stream_reactions_allowed_after_hours")}
              <Countdown countdownEnd={streamReactionCountdownEnd} />
            </div>
            <div className="cir-text-2xl cir-font-bold">
              {getLanguageString("stream_reactions_allowed_after_hours_note")}
            </div>
          </>
        ) : (
          <div className="cir-bg-red-500 border cir-border-red-600 cir-px-2 cir-py-1 cir-rounded-full cir-text-2xl cir-flex cir-gap-2 cir-items-center cir-pr-3 cir-font-bold cir-text-black">
            <XIcon />
            {getLanguageString("stream_reactions_not_allowed")}
          </div>
        )}

        {guidelines.rules.video.video_reactions_allowed ? (
          <div className="cir-bg-green-500 border cir-border-green-600 cir-px-2 cir-py-1 cir-rounded-full cir-text-2xl cir-flex cir-gap-2 cir-items-center cir-pr-3 cir-font-bold cir-text-black">
            <Check />
            {getLanguageString("video_reactions_allowed")}
          </div>
        ) : guidelines.rules.video.video_reaction_allowed_after_hours ? (
          <>
            <div className="cir-bg-orange-500 border cir-border-orange-600 cir-px-2 cir-py-1 cir-rounded-full cir-text-2xl cir-flex cir-gap-2 cir-items-center cir-pr-3 cir-font-bold cir-text-black">
              <OctagonAlert />
              {getLanguageString("video_reactions_allowed_after_hours")}
              <Countdown countdownEnd={videoReactionCountdownEnd} />
            </div>
            <div className="cir-text-2xl cir-font-bold">
              {getLanguageString("video_reactions_allowed_after_hours_note")}
            </div>
          </>
        ) : (
          <div className="cir-bg-red-500 border cir-border-red-600 cir-px-2 cir-py-1 cir-rounded-full cir-text-2xl cir-flex cir-gap-2 cir-items-center cir-pr-3 cir-font-bold cir-text-black">
            <XIcon />
            {getLanguageString("video_reactions_not_allowed")}
          </div>
        )}

        {hasRestrictions && (
          <div className="cir-bg-orange-500 border cir-border-orange-600 cir-px-2 cir-py-1 cir-rounded-full cir-text-2xl cir-flex cir-gap-2 cir-items-center cir-pr-3 cir-font-bold cir-text-black">
            <OctagonAlert />
            {getLanguageString("restrictions")}
          </div>
        )}
      </div>

      {open && (
        <>
          <h2 className="cir-text-2xl cir-font-bold cir-flex cir-items-center cir-gap-2 cir-mt-4 cir-mb-2">
            <RadioTower size={20} />
            On-Stream
          </h2>

          <div className="cir-text-xl dark:cir-text-white/75 text-black/7 cir-ml-3">
            {!hasStreamRestrictions && (
              <p>{getLanguageString("no_restrictions")}</p>
            )}

            {guidelines.rules.stream.sponsor_skips_allowed !== null &&
              (guidelines.rules.stream.sponsor_skips_allowed ? (
                <li className="cir-mb-2">
                  {getLanguageString("sponsor_skips_allowed")}
                </li>
              ) : (
                <li className="cir-mb-2">
                  {getLanguageString("sponsor_skips_not_allowed")}
                </li>
              ))}

            {guidelines.rules.stream.credit_stream_chat && (
              <li className="cir-mb-2">
                {getLanguageString("credit_stream_chat")}
              </li>
            )}

            {guidelines.rules.stream.custom_rules
              .filter((r) => r)
              .map((rule, index) => (
                <li key={index} className="cir-mb-2">
                  {rule}
                </li>
              ))}
          </div>

          <h2 className="cir-text-2xl cir-font-bold cir-flex cir-items-center cir-gap-2 cir-mt-4 cir-mb-2">
            <Video size={20} />
            Reaction Video
          </h2>

          <div className="cir-text-xl dark:cir-text-white/75 text-black/75 cir-ml-3">
            {!hasVideoRestrictions && (
              <p className="cir-text-lg cir-mb-2">
                {getLanguageString("no_restrictions")}
              </p>
            )}

            {guidelines.rules.video.sponsor_cut_allowed !== null &&
              (guidelines.rules.video.sponsor_cut_allowed ? (
                <li className="cir-mb-2">
                  {getLanguageString("sponsor_cut_allowed")}
                </li>
              ) : (
                <li className="cir-mb-2">
                  {getLanguageString("sponsor_cut_not_allowed")}
                </li>
              ))}

            {guidelines.rules.video.credit_video_description && (
              <li className="cir-mb-2">
                {getLanguageString("credit_video_description")}
              </li>
            )}

            {guidelines.rules.video.reaction_video_includes_title && (
              <li className="cir-mb-2">
                {getLanguageString("reaction_video_includes_title")}
              </li>
            )}

            {guidelines.rules.video.monetization_allowed !== null &&
              (guidelines.rules.video.monetization_allowed === false ? (
                <li className="cir-mb-2">
                  {getLanguageString("monetization_not_allowed")}
                </li>
              ) : (
                <li className="cir-mb-2">
                  {getLanguageString("monetization_allowed")}
                </li>
              ))}

            {guidelines.rules.video.reaction_video_splittling_allowed !==
              null &&
              (guidelines.rules.video.reaction_video_splittling_allowed ===
              false ? (
                <li className="cir-mb-2">
                  {getLanguageString("reaction_video_splittling_not_allowed")}
                </li>
              ) : (
                <li className="cir-mb-2">
                  {getLanguageString("reaction_video_splittling_allowed")}
                </li>
              ))}

            {guidelines.rules.video.custom_rules
              .filter((r) => r)
              .map((rule, index) => (
                <li key={index} className="cir-mb-2">
                  {rule}
                </li>
              ))}
          </div>

          {originalVideoMetadata.data && (
            <a
              className="cir-text-2xl cir-max-w-full cir-mt-4 cir-bg-white/25 cir-p-3 cir-px-4 cir-border-2 cir-rounded-lg cir-flex cir-gap-4 cir-min-w-96 cir-w-max cir-border-green cir-no-underline cir-text-white"
              href={guidelines.original_video}
            >
              <img
                src={originalVideoMetadata.data.thumbnail}
                alt={originalVideoMetadata.data.title}
                className="cir-w-64 cir-aspect-video cir-rounded-md cir-border cir-border-border"
              />

              <div>
                <p className="cir-text-4xl cir-mt-2 cir-font-bold">
                  {originalVideoMetadata.data.title}
                </p>

                <p className="cir-text-2xl cir-text-white/75">
                  {originalVideoMetadata.data.channelName}
                </p>
              </div>
            </a>
          )}

          {guidelines.sponsor_segments &&
            guidelines.sponsor_segments.length > 0 && (
              <p>
                Uses SponsorBlock data for sponsor segment detection licensed
                used under CC BY-NC-SA 4.0 from https://sponsor.ajay.app/
              </p>
            )}

          <div className="cir-flex cir-gap-2 cir-items-center cir-mt-4">
            {guidelines.source === "streamfinity" && (
              <>
                <img
                  src={lightStreamfinitySrc}
                  alt="Streamfinity"
                  className="reaction-info-source light-version"
                />
                <img
                  src={darkStreamfinitySrc}
                  alt="Streamfinity"
                  className="reaction-info-source dark-version"
                />
              </>
            )}

            {guidelines.source === "canireact" && (
              <>
                <img
                  src={lightCIRSrc}
                  alt="Can I React?"
                  className="reaction-info-source light-version"
                />
                <img
                  src={darkCIRSrc}
                  alt="Can I React?"
                  className="reaction-info-source dark-version"
                />
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cir-flex cir-gap-1 cir-items-center cir-justify-center cir-size-12 cir-bg-black/25 cir-rounded-full">
                  <Info />
                </div>
              </TooltipTrigger>
              <TooltipContent className="cir-text-2xl">
                {getLanguageString("guideline_disclaimer")}
              </TooltipContent>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
};

class ReactionInfo {
  container: HTMLElement;
  root: Root;

  constructor(
    container: HTMLElement,
    guidelines: Guidelines,
    defaultOpen: boolean
  ) {
    this.container = container;

    const element = document.createElement("div");
    element.id = "cir-reaction-info-parent";
    this.container.parentNode?.insertBefore(element, this.container);

    const queryClient = new QueryClient();

    this.root = createRoot(element);
    this.root.render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ReactionInfoComponent
            defaultOpen={defaultOpen}
            guidelines={guidelines}
          />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  destroy() {
    this.root.unmount();
    document.getElementById("cir-reaction-info-parent")?.remove();
  }
}

export default ReactionInfo;

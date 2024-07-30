import React, { useState } from "react";
import { createRoot, Root } from "react-dom/client";
import {
  formatTime,
  getCurrentTime,
  getVideoId,
  skipTo,
} from "../utils/youtube";
import { Button } from "./ui/button";
import { TrashIcon } from "@radix-ui/react-icons";
import {
  fetchSegments,
  rateSegment,
  submitSegment,
  TosSegment,
} from "../utils/api";
import { cn, log } from "../utils";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import browser from "webextension-polyfill";
import { Play, ThumbsDown, ThumbsUp, XIcon } from "lucide-react";
import { closeTosEditor } from "./settings";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";
import { currentProfile } from "..";
import { getLanguageString } from "../utils/language";

const TosSegmentEditor: React.FC = () => {
  const videoId = getVideoId(window.location.href);

  const [loggedIn, setLoggedIn] = useState(!!currentProfile);

  const segmentsQuery = useQuery({
    queryKey: ["segments", videoId],
    queryFn: async () => {
      return fetchSegments(videoId);
    },
  });

  const voteMutation = useMutation({
    mutationKey: ["rate", videoId],
    mutationFn: async ({
      segment,
      vote,
    }: {
      segment: TosSegment;
      vote: "up" | "down";
    }) => {
      return rateSegment(segment.id, vote === "up" ? "UPVOTE" : "DOWNVOTE");
    },
  });

  const [segments, setSegments] = React.useState<[number, number][]>([]);
  const [startTimestamp, setStartTimestamp] = React.useState<number>(0);
  const [endTimestamp, setEndTimestamp] = React.useState<number>(0);

  const [saving, setSaving] = useState(false);

  const deleteCurrent = () => {
    setStartTimestamp(0);
    setEndTimestamp(0);
  };

  const addCurrent = () => {
    setSegments([...segments, [startTimestamp, endTimestamp]]);
    deleteCurrent();
  };

  const save = async () => {
    setSaving(true);

    const saveAll = async () => {
      try {
        for (const segment of segments) {
          await submitSegment(videoId, {
            start: segment[0],
            end: segment[1],
            category: "TOS",
          });
        }
      } catch (e) {
        log(e);
      }
    };

    const promise = saveAll();

    toast.promise(promise, {
      loading: "Saving segments...",
      success: "Segments saved!",
      error: "Error saving segments",
    });

    await promise;

    setSegments([]);
    await segmentsQuery.refetch();
    setSaving(false);
  };

  const handleVote = async (segment: TosSegment, vote: "up" | "down") => {
    const promise = voteMutation.mutateAsync({ segment, vote });

    toast.promise(promise, {
      loading: "Submitting vote...",
      success: "Vote submitted!",
      error: "Error submitting vote",
    });

    await promise;
  };

  const toggleOpen = () => {
    closeTosEditor();
  };

  const cirIconSrc = browser.runtime.getURL("images/round-icon.svg");

  const handleLogin = () => {
    browser.runtime
      .sendMessage({ message: "openLogin" })
      .then(() => {
        setLoggedIn(true);
        toast.success("Logged in successfully");
      })
      .catch((error) => {
        toast.error("Error logging in");
        setLoggedIn(false);
      });
  };

  return (
    <div className="tos-editor cir-font-sans cir-relative cir-overflow-hidden">
      <div className="cir-flex cir-items-center">
        <img
          src={cirIconSrc}
          alt="can i react"
          className="cir-icon cir-size-12 cir-mr-2"
        />
        <h1 className="cir-text-4xl cir-font-bold">TOS Segment Editor</h1>
      </div>

      <button
        className={cn(
          "cir-absolute cir-right-4 cir-top-3 cir-p-0 cir-bg-black/25 cir-rounded-full cir-aspect-square cir-size-12 cir-text-white cir-transition-transform cir-cursor-pointer cir-flex cir-justify-center cir-items-center",
          !open && "closed"
        )}
        onClick={toggleOpen}
      >
        <XIcon size={20} />
      </button>

      {!loggedIn ? (
        <div className="cir-my-6">
          <h2 className="cir-text-2xl cir-my-1">
            You need to login to use this feature.
          </h2>

          <Button onClick={handleLogin}>Login with Twitch</Button>
        </div>
      ) : (
        <>
          <div className="">
            <div className="tos-editor__segments__list">
              <p className="cir-text-xl cir-text-white/75 cir-my-2">
                {getLanguageString(
                  "tos_segment_editor_saved_segments_description"
                )}
              </p>

              <h3 className="cir-text-2xl cir-my-1">Saved Segments</h3>

              {segmentsQuery.isLoading && <p>Loading...</p>}

              {segmentsQuery.isError && (
                <p>Error fetching segments: {segmentsQuery.error.message}</p>
              )}

              {segmentsQuery.data?.length === 0 && (
                <p>No segments found for this video</p>
              )}

              {segmentsQuery.data
                ?.sort((a, b) => a.start - b.start)
                .map((segment) => (
                  <Segment
                    key={segment.id}
                    start={segment.start}
                    end={segment.end}
                    vote={(vote) => handleVote(segment, vote)}
                    stored
                  />
                ))}

              <hr className="cir-my-4 cir-border-neutral-500" />

              {segments.map(([start, end], index) => (
                <Segment
                  key={index}
                  start={start}
                  end={end}
                  remove={() => {
                    const newSegments = segments.filter((_, i) => i !== index);
                    setSegments(newSegments);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="cir-mt-2 cir-flex cir-items-center cir-gap-2 cir-text-xl">
            <Button
              disabled={startTimestamp > 0}
              onClick={async () => setStartTimestamp(await getCurrentTime())}
            >
              Start
            </Button>
            <Button
              disabled={endTimestamp > 0 || startTimestamp === 0}
              onClick={async () => setEndTimestamp(await getCurrentTime())}
            >
              Stop
            </Button>
            <Button
              disabled={startTimestamp === 0 || endTimestamp === 0}
              onClick={addCurrent}
            >
              Add
            </Button>
            <Button disabled={segments.length === 0} onClick={deleteCurrent}>
              <TrashIcon />
            </Button>
          </div>

          <Button
            className="cir-mt-4"
            disabled={saving || segments.length === 0}
            onClick={save}
            variant="secondary"
          >
            Save
          </Button>
        </>
      )}
    </div>
  );
};

const Segment: React.FC<{
  start: number;
  end: number;
  stored?: boolean;
  remove?: () => void;
  vote?: (vote: "up" | "down") => void;
}> = ({ start, end, stored, remove, vote }) => {
  return (
    <div className="cir-text-2xl cir-font-medium cir-my-1 cir-p-2 cir-border-2 cir-border-neutral-700 cir-px-2 cir-rounded-xl cir-flex cir-items-center cir-justify-between">
      <div>
        <span>{formatTime(start)}</span>-<span>{formatTime(end)}</span>
      </div>
      {stored ? (
        <div className="cir-flex cir-gap-2 cir-items-center">
          <button
            onClick={() => skipTo(start)}
            className="cir-bg-neutral-800 hover:cir-bg-neutral-700 cir-h-[25px] cir-w-auto cir-aspect-square cir-rounded-full cir-p-2 cir-flex cir-items-center cir-justify-center cir-outline-none focus-visible:cir-ring-2 cir-ring-black dark:cir-ring-white focus-visible:cir-bg-neutral-950 cir-cursor-pointer cir-text-white"
          >
            <Play />
          </button>

          <button
            onClick={() => vote && vote("up")}
            className="cir-bg-neutral-800 hover:cir-bg-neutral-700 cir-h-[25px] cir-w-auto cir-aspect-square cir-rounded-full cir-p-2 cir-flex cir-items-center cir-justify-center cir-outline-none focus-visible:cir-ring-2 cir-ring-black dark:cir-ring-white focus-visible:cir-bg-neutral-950 cir-cursor-pointer cir-text-white"
          >
            <ThumbsUp />
          </button>

          <button
            onClick={() => vote && vote("down")}
            className="cir-bg-neutral-800 hover:cir-bg-neutral-700 cir-h-[25px] cir-w-auto cir-aspect-square cir-rounded-full cir-p-2 cir-flex cir-items-center cir-justify-center cir-outline-none focus-visible:cir-ring-2 cir-ring-black dark:cir-ring-white focus-visible:cir-bg-neutral-950 cir-cursor-pointer cir-text-white"
          >
            <ThumbsDown />
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => remove && remove()}
            disabled={!remove}
            className="cir-bg-neutral-800 hover:cir-bg-neutral-700 cir-h-[25px] cir-w-auto cir-aspect-square cir-rounded-full cir-p-2 cir-flex cir-items-center cir-justify-center cir-outline-none focus-visible:cir-ring-2 cir-ring-black dark:cir-ring-white focus-visible:cir-bg-neutral-950 cir-cursor-pointer cir-text-white"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
};

class TosEditor {
  container: HTMLElement;
  root: Root;

  constructor() {
    log("Creating TosEditor");
    this.container = document.querySelector(
      ".watch-root-element #secondary"
    ) as HTMLElement;
    log(this.container);

    const queryClient = new QueryClient();

    const element = document.createElement("div");
    element.id = "tos-segment-editor";
    this.container.insertBefore(element, this.container.firstChild);

    this.root = createRoot(element);
    this.root.render(
      <QueryClientProvider client={queryClient}>
        <TosSegmentEditor />
        <Toaster />
      </QueryClientProvider>
    );
  }

  destroy() {
    this.root.unmount();
    document.getElementById("tos-segment-editor")?.remove();
  }
}

export default TosEditor;

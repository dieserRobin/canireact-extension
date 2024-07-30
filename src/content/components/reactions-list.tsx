import React from "react";
import { createRoot, Root } from "react-dom/client";
import { getVideoId } from "../utils/youtube";
import { fetchReactions, ReactionVideo } from "../utils/api";
import { cn } from "../utils";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import browser from "webextension-polyfill";
import { XIcon } from "lucide-react";
import { closeReactionsList } from "./settings";
import { Toaster } from "./ui/sonner";
import { ScrollArea } from "./ui/scroll-area";
import { getLanguage } from "../utils/language";

const ReactionsListCard: React.FC = () => {
  const videoId = getVideoId(window.location.href);

  const reactionsQuery = useQuery({
    queryKey: ["reactions", videoId],
    queryFn: async () => {
      return fetchReactions(videoId);
    },
  });

  const toggleOpen = () => {
    closeReactionsList();
  };

  const cirIconSrc = browser.runtime.getURL("images/round-icon.svg");

  return (
    <div className="tos-editor cir-font-sans cir-relative cir-overflow-hidden">
      <div className="cir-flex cir-items-center">
        <img
          src={cirIconSrc}
          alt="can i react"
          className="cir-icon cir-size-12 cir-mr-2"
        />
        <h1 className="cir-text-4xl cir-font-bold">Reactions</h1>
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

      {reactionsQuery.isLoading && (
        <div className="cir-p-4 cir-text-center cir-text-lg">
          Loading reactions...
        </div>
      )}

      {reactionsQuery.isError && (
        <div className="cir-p-4 cir-text-center cir-text-lg">
          Error loading reactions
        </div>
      )}

      {reactionsQuery.isSuccess &&
        reactionsQuery.data &&
        reactionsQuery.data.length >= 3 && (
          <>
            <h3 className="cir-mt-2 cir-text-white/75">
              {Intl.NumberFormat(getLanguage()).format(
                reactionsQuery.data
                  .map((reaction) => reaction.views)
                  .reduce((a, b) => a + b, 0)
              )}{" "}
              Reaction Views
            </h3>
          </>
        )}

      <ScrollArea className="cir-h-96 cir-mt-4">
        {reactionsQuery.isSuccess &&
          reactionsQuery.data
            ?.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
            .map((reaction) => <Reaction data={reaction} key={reaction.id} />)}
      </ScrollArea>
    </div>
  );
};

const Reaction: React.FC<{ data: ReactionVideo }> = ({ data }) => {
  return (
    <a
      key={data.id}
      href={`https://youtube.com/watch?v=${data.id}`}
      target="_blank"
      className="cir-flex cir-gap-2 cir-text-white cir-no-underline cir-my-2 cir-px-1"
    >
      <img
        src={data.thumbnail}
        alt={data.title}
        className="cir-w-1/3 cir-aspect-video cir-rounded-lg cir-mr-2"
      />
      <div>
        <h3 className="cir-text-lg cir-font-bold">{data.title}</h3>
        <p className="cir-text-sm cir-text-gray-500">{data.author.name}</p>
      </div>
    </a>
  );
};

class ReactionsList {
  container: HTMLElement;
  root: Root;

  constructor() {
    this.container = document.querySelector(
      ".watch-root-element #secondary"
    ) as HTMLElement;

    const queryClient = new QueryClient();

    const element = document.createElement("div");
    element.id = "reactions-list-card";
    this.container.insertBefore(element, this.container.firstChild);

    this.root = createRoot(element);
    this.root.render(
      <QueryClientProvider client={queryClient}>
        <ReactionsListCard />
        <Toaster />
      </QueryClientProvider>
    );
  }

  destroy() {
    this.root.unmount();
    document.getElementById("reactions-list-card")?.remove();
  }
}

export default ReactionsList;

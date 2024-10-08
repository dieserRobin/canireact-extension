import React from "react";
import { createRoot, Root } from "react-dom/client";
import { TooltipProvider } from "./ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  reactionInfoMinimized,
  sponsorRemindersActive,
  toggleMinimize,
  toggleSponsorReminders,
} from "..";
import TosEditor from "./tos-segment-editor";
import { log } from "../utils";
import ReactionsList from "./reactions-list";

type Props = {};

export let tosEditor: TosEditor = undefined;
export let reactionsList: ReactionsList = undefined;

export function closeTosEditor() {
  if (tosEditor) {
    tosEditor.destroy();
    tosEditor = undefined;
  }
}

export function closeReactionsList() {
  if (reactionsList) {
    reactionsList.destroy();
    reactionsList = undefined;
  }
}

const ReactionInfoComponent: React.FC<Props> = ({}) => {
  const [minimized, setMinimized] = React.useState(reactionInfoMinimized);
  const [sponsorReminders, setSponsorReminders] = React.useState(
    sponsorRemindersActive
  );

  const handleReactionInfoToggle = () => {
    toggleMinimize();
    setMinimized(!minimized);
  };

  const handleSponsorRemindersToggle = () => {
    toggleSponsorReminders();
    setSponsorReminders(!sponsorReminders);
  };

  const handleToggleTosEditor = () => {
    log("Toggling Tos Editor", tosEditor);
    if (!tosEditor) {
      tosEditor = new TosEditor();
    } else {
      tosEditor.destroy();
      tosEditor = undefined;
    }
  };

  const handleToggleReactionsList = () => {
    if (!reactionsList) {
      reactionsList = new ReactionsList();
    } else {
      reactionsList.destroy();
      reactionsList = undefined;
    }
  };

  const handleOpenWebsite = () => {
    window.open("https://canireact.com/create", "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="cir-settings-button"
          className="hover:cir-bg-neutral-300 dark:hover:cir-bg-neutral-700 cir-h-[36px] cir-w-auto cir-aspect-square cir-rounded-full cir-p-3 cir-ml-4 cir-flex cir-items-center cir-justify-center cir-outline-none focus-visible:cir-ring-2 cir-ring-black dark:cir-ring-white focus-visible:cir-bg-neutral-200 dark:focus-visible:cir-bg-neutral-950 cir-cursor-pointer"
        >
          <svg
            viewBox="0 0 486 373"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="themed-stroke cir-h-3/4"
          >
            <path
              d="M242.754 351.817L20.4438 20.2754L465.065 20.2754L242.754 351.817Z"
              strokeWidth="40.4588"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M229.203 29.2109L179.43 77.6536C176.014 80.9547 173.302 84.8811 171.452 89.2067C169.602 93.5322 168.649 98.1714 168.649 102.857C168.649 107.542 169.602 112.182 171.452 116.507C173.302 120.833 176.014 124.759 179.43 128.06C193.219 141.48 215.246 141.971 229.875 129.206L264.682 98.1108C273.406 90.4058 284.765 86.1375 296.546 86.1375C308.327 86.1375 319.686 90.4058 328.411 98.1108L378.183 141.644"
              strokeWidth="40.4588"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M336.235 207.654L295.776 167.195"
              strokeWidth="40.4588"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M275.546 268.347L235.087 227.889"
              strokeWidth="40.4588"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="cir-font-sans">
        <span className="cir-text-neutral-900 dark:cir-text-neutral-200 cir-font-bold cir-text-lg cir-p-5 cir-uppercase">
          Can I React?
        </span>
        <DropdownMenuItem onClick={handleReactionInfoToggle}>
          {minimized ? "Show" : "Hide"} Reaction Info
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSponsorRemindersToggle}>
          {sponsorReminders ? "Disable" : "Enable"} Placement Reminders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenWebsite}>
          Create Guidelines
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleTosEditor}>
          Toggle Tos Editor
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleReactionsList}>
          Toggle Reactions List
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

class Settings {
  container: HTMLElement;
  root: Root;

  constructor() {
    log("Settings component created");
    let container = document.querySelector(
      "#above-the-fold #top-row #actions #actions-inner #menu #top-level-buttons-computed"
    );

    this.container = container as HTMLElement;

    const element = document.createElement("div");
    element.id = "cir-settings";

    this.container && this.container.appendChild(element);
    log("Settings component appended", this.container !== null);

    const queryClient = new QueryClient();

    this.root = createRoot(element);
    this.root.render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ReactionInfoComponent />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  destroy() {
    log("Settings component destroyed");
    this.root.unmount();
    tosEditor?.destroy();
    reactionsList?.destroy();
    tosEditor = undefined;
    reactionsList = undefined;
    document.getElementById("cir-settings")?.remove();
  }
}

export default Settings;

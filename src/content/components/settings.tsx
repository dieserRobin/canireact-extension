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

type Props = {};

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

  const handleOpenWebsite = () => {
    window.open("https://canireact.com/create", "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="cir-settings-button"
          className="cir-bg-neutral-800 hover:cir-bg-neutral-700 cir-h-[36px] cir-w-auto cir-aspect-square cir-rounded-full cir-p-3 cir-ml-4 cir-flex cir-items-center cir-justify-center cir-outline-none focus-visible:cir-ring-2 cir-ring-black dark:cir-ring-white focus-visible:cir-bg-neutral-950 cir-cursor-pointer"
        >
          <svg
            viewBox="0 0 486 373"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="themed-stroke cir-h-3/4"
          >
            <path
              d="M242.754 351.817L20.4438 20.2754L465.065 20.2754L242.754 351.817Z"
              stroke-width="40.4588"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M229.203 29.2109L179.43 77.6536C176.014 80.9547 173.302 84.8811 171.452 89.2067C169.602 93.5322 168.649 98.1714 168.649 102.857C168.649 107.542 169.602 112.182 171.452 116.507C173.302 120.833 176.014 124.759 179.43 128.06C193.219 141.48 215.246 141.971 229.875 129.206L264.682 98.1108C273.406 90.4058 284.765 86.1375 296.546 86.1375C308.327 86.1375 319.686 90.4058 328.411 98.1108L378.183 141.644"
              stroke-width="40.4588"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M336.235 207.654L295.776 167.195"
              stroke-width="40.4588"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M275.546 268.347L235.087 227.889"
              stroke-width="40.4588"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="cir-font-sans">
        <DropdownMenuItem onClick={handleReactionInfoToggle}>
          {minimized ? "Show" : "Hide"} Reaction Info
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSponsorRemindersToggle}>
          {sponsorReminders ? "Disable" : "Enable"} Placement Reminders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenWebsite}>
          Create Guidelines
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

class Settings {
  container: HTMLElement;
  root: Root;

  constructor() {
    let container = document.querySelector(
      "#above-the-fold #top-row #actions #actions-inner #menu #top-level-buttons-computed"
    );

    this.container = container as HTMLElement;

    if (!this.container) {
      throw new Error("Container not found");
    }

    const element = document.createElement("div");
    element.id = "cir-settings";

    this.container.appendChild(element);

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
    this.root.unmount();
    document.getElementById("cir-settings")?.remove();
  }
}

export default Settings;

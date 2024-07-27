import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "../../utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "cir-z-50 cir-overflow-hidden cir-rounded-md cir-border cir-border-neutral-200 cir-bg-white cir-px-3 cir-py-1.5 cir-text-sm cir-text-neutral-950 cir-shadow-md cir-animate-in cir-fade-in-0 cir-zoom-in-95 data-[state=closed]:cir-animate-out data-[state=closed]:cir-fade-out-0 data-[state=closed]:cir-zoom-out-95 data-[side=bottom]:cir-slide-in-from-top-2 data-[side=left]:cir-slide-in-from-right-2 data-[side=right]:cir-slide-in-from-left-2 data-[side=top]:cir-slide-in-from-bottom-2 dark:cir-border-neutral-800 dark:cir-bg-neutral-950 dark:cir-text-neutral-50",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

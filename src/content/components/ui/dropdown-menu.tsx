import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "../../utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "cir-flex cir-cursor-default cir-select-none cir-items-center cir-rounded-sm cir-px-4 cir-py-3 cir-text-xl cir-outline-none focus:cir-bg-neutral-100 data-[state=open]:cir-bg-neutral-100 dark:focus:cir-bg-neutral-800 dark:data-[state=open]:cir-bg-neutral-800",
      inset && "cir-pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="cir-ml-auto cir-h-4 cir-w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "cir-z-50 cir-min-w-[8rem] cir-overflow-hidden cir-rounded-md cir-border cir-border-neutral-200 cir-bg-neutral-400 cir-p-1 cir-text-neutral-950 cir-shadow-lg data-[state=open]:cir-animate-in data-[state=closed]:cir-animate-out data-[state=closed]:cir-fade-out-0 data-[state=open]:cir-fade-in-0 data-[state=closed]:cir-zoom-out-95 data-[state=open]:cir-zoom-in-95 data-[side=bottom]:cir-slide-in-from-top-2 data-[side=left]:cir-slide-in-from-right-2 data-[side=right]:cir-slide-in-from-left-2 data-[side=top]:cir-slide-in-from-bottom-2 dark:cir-border-neutral-800 dark:cir-bg-neutral-800 dark:cir-text-neutral-50",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "cir-z-50 cir-min-w-[8rem] cir-overflow-hidden cir-rounded-2xl cir-border cir-border-white cir-bg-white cir-py-5 cir-text-neutral-950 cir-shadow-md data-[state=open]:cir-animate-in data-[state=closed]:cir-animate-out data-[state=closed]:cir-fade-out-0 data-[state=open]:cir-fade-in-0 data-[state=closed]:cir-zoom-out-95 data-[state=open]:cir-zoom-in-95 data-[side=bottom]:cir-slide-in-from-top-2 data-[side=left]:cir-slide-in-from-right-2 data-[side=right]:cir-slide-in-from-left-2 data-[side=top]:cir-slide-in-from-bottom-2 dark:cir-border-neutral-800 dark:cir-bg-neutral-800 dark:cir-text-neutral-50",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "cir-relative cir-flex cir-cursor-default cir-select-none cir-items-center cir-px-6 cir-py-4 cir-text-xl cir-outline-none cir-transition-colors focus:cir-bg-neutral-300 focus:cir-text-neutral-900 data-[disabled]:cir-pointer-events-none data-[disabled]:cir-opacity-50 hover:cir-bg-neutral-300 dark:hover:cir-bg-neutral-600 dark:focus:cir-bg-neutral-600 dark:focus:cir-text-neutral-50",
      inset && "cir-pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "cir-relative cir-flex cir-cursor-default cir-select-none cir-items-center cir-rounded-sm cir-py-1.5 cir-pl-8 cir-pr-2 cir-text-xl cir-outline-none cir-transition-colors focus:cir-bg-neutral-100 focus:cir-text-neutral-900 data-[disabled]:cir-pointer-events-none data-[disabled]:cir-opacity-50 dark:focus:cir-bg-neutral-800 dark:focus:cir-text-neutral-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="cir-absolute cir-left-2 cir-flex cir-h-3.5 cir-w-3.5 cir-items-center cir-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="cir-h-4 cir-w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "cir-relative cir-flex cir-cursor-default cir-select-none cir-items-center cir-rounded-sm cir-py-1.5 cir-pl-8 cir-pr-2 cir-text-xl cir-outline-none cir-transition-colors focus:cir-bg-neutral-100 focus:cir-text-neutral-900 data-[disabled]:cir-pointer-events-none data-[disabled]:cir-opacity-50 dark:focus:cir-bg-neutral-800 dark:focus:cir-text-neutral-50",
      className
    )}
    {...props}
  >
    <span className="cir-absolute cir-left-2 cir-flex cir-h-3.5 cir-w-3.5 cir-items-center cir-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="cir-h-2 cir-w-2 cir-fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "cir-px-2 cir-py-1.5 cir-text-xl cir-font-semibold",
      inset && "cir-pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(
      "cir--mx-1 cir-my-1 cir-h-px cir-bg-neutral-100 dark:cir-bg-neutral-800",
      className
    )}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "cir-ml-auto cir-text-xs cir-tracking-widest cir-opacity-60",
        className
      )}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};

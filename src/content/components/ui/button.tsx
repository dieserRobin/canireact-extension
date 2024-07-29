import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../utils";

const buttonVariants = cva(
  "cir-inline-flex cir-items-center cir-justify-center cir-whitespace-nowrap cir-rounded-md cir-text-sm cir-font-medium cir-ring-offset-white cir-transition-colors focus-visible:cir-outline-none focus-visible:cir-ring-2 focus-visible:cir-ring-neutral-950 focus-visible:cir-ring-offset-2 disabled:cir-pointer-events-none disabled:cir-opacity-50 dark:cir-ring-offset-neutral-950 dark:focus-visible:cir-ring-neutral-300",
  {
    variants: {
      variant: {
        default:
          "cir-bg-neutral-900 cir-text-neutral-50 hover:cir-bg-neutral-900/90 dark:cir-bg-neutral-50 dark:cir-text-neutral-900 dark:hover:cir-bg-neutral-50/90",
        destructive:
          "cir-bg-red-500 cir-text-neutral-50 hover:cir-bg-red-500/90 dark:cir-bg-red-900 dark:cir-text-neutral-50 dark:hover:cir-bg-red-900/90",
        outline:
          "cir-border cir-border-neutral-200 cir-bg-white hover:cir-bg-neutral-100 hover:cir-text-neutral-900 dark:cir-border-neutral-800 dark:cir-bg-neutral-950 dark:hover:cir-bg-neutral-800 dark:hover:cir-text-neutral-50",
        secondary:
          "cir-bg-neutral-100 cir-text-neutral-900 hover:cir-bg-neutral-100/80 dark:cir-bg-neutral-800 dark:cir-text-neutral-50 dark:hover:cir-bg-neutral-800/80",
        ghost:
          "hover:cir-bg-neutral-100 hover:cir-text-neutral-900 dark:hover:cir-bg-neutral-800 dark:hover:cir-text-neutral-50",
        link: "cir-text-neutral-900 cir-underline-offset-4 hover:cir-underline dark:cir-text-neutral-50",
      },
      size: {
        default: "cir-h-10 cir-px-4 cir-py-2",
        sm: "cir-h-9 cir-rounded-md cir-px-3",
        lg: "cir-h-11 cir-rounded-md cir-px-8",
        icon: "cir-h-10 cir-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

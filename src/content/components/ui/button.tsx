import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../utils"

const buttonVariants = cva(
  "cir-inline-flex cir-font-sans cir-items-center cir-justify-center cir-whitespace-nowrap cir-rounded-md cir-font-medium cir-ring-offset-background cir-transition-colors focus-visible:cir-outline-none focus-visible:cir-ring-2 focus-visible:cir-ring-ring focus-visible:cir-ring-offset-2 disabled:cir-pointer-events-none disabled:cir-opacity-50",
  {
    variants: {
      variant: {
        default: "cir-bg-neutral-600 cir-text-primary-foreground hover:cir-bg-neutral-600/90",
        destructive:
          "cir-bg-destructive cir-text-destructive-foreground hover:cir-bg-destructive/90",
        outline:
          "cir-border cir-border-input cir-bg-background hover:cir-bg-accent hover:cir-text-accent-foreground",
        secondary:
          "cir-bg-secondary cir-text-secondary-foreground hover:cir-bg-secondary/80",
        ghost: "hover:cir-bg-accent hover:cir-text-accent-foreground",
        link: "cir-text-primary cir-underline-offset-4 hover:cir-underline",
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
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

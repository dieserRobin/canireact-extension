import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import React from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "cir-bg-white cir-p-4 cir-rounded-xl cir-shadow-lg dark:cir-bg-neutral-800 dark:cir-text-neutral-50 cir-text-neutral-900 cir-font-sans",
          description:
            "group-[.toast]:cir-text-neutral-500 dark:group-[.toast]:cir-text-neutral-400",
          actionButton:
            "group-[.toast]:cir-bg-neutral-900 group-[.toast]:cir-text-neutral-50 dark:group-[.toast]:cir-bg-neutral-50 dark:group-[.toast]:cir-text-neutral-900",
          cancelButton:
            "group-[.toast]:cir-bg-neutral-100 group-[.toast]:cir-text-neutral-500 dark:group-[.toast]:cir-bg-neutral-800 dark:group-[.toast]:cir-text-neutral-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

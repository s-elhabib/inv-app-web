"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { X } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={false}
      closeButton={true}
      icons={{
        close: (className) => <X className={className} size={16} />,
      }}
      offset={16}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:p-4 group-[.toaster]:pr-10 group-[.toaster]:relative",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:absolute group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:p-1 group-[.toast]:rounded-md group-[.toast]:text-foreground/50 group-[.toast]:opacity-100 group-[.toast]:hover:bg-accent group-[.toast]:hover:text-foreground",
        },
        duration: 4000,
      }}
      {...props}
    />
  );
};

export { Toaster };

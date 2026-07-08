import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          // text-base (16px) on mobile stops iOS Safari auto-zooming on focus; md:text-sm keeps the desktop size.
          "h-10 w-full rounded-md border border-input bg-surface px-3 text-base md:text-sm",
          "placeholder:text-subtle focus-visible:border-ring focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-20 w-full rounded-md border border-input bg-surface px-3 py-2 text-base md:text-sm",
        "placeholder:text-subtle focus-visible:border-ring focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

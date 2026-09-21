import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:pointer-events-none disabled:opacity-50 h-11 px-4",
  {
    variants: {
      variant: {
        default: "bg-emerald-700 text-white hover:bg-emerald-800",
        outline:
          "border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--soft)]",
        ghost: "hover:bg-[var(--soft)]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, className }))} {...props} />
  );
}

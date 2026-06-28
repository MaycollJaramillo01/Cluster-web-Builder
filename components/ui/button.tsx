import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-semibold ring-offset-background transition-[color,background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";
const variants = {
  default: "bg-[#8b5cf6] text-white hover:bg-[#9d78f8] hover:shadow-[var(--shadow-glow)]",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-transparent hover:border-[#8b5cf6] hover:bg-muted",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/75",
  ghost: "hover:bg-muted hover:text-foreground",
  link: "text-primary underline-offset-4 hover:underline",
} as const;
const sizes = { default: "h-11 px-4 py-2", sm: "h-11 px-3", lg: "h-12 px-8", icon: "h-11 w-11" } as const;

type ButtonVariant = keyof typeof variants;
type ButtonSize = keyof typeof sizes;

function buttonVariants({ variant = "default", size = "default", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

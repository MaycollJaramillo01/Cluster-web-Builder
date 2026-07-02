"use client";

/** Small shared UI atoms for the block editor sidebar — kept dependency-free to avoid circular imports between EditorContentPanel and its sub-panels. */

export const fieldClass = "border-border bg-[#120c1d] text-foreground placeholder:text-muted-foreground focus:border-[#8b5cf6] focus:ring-0 transition-colors";

export function IconButton({ children, onClick, disabled, title }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
}) {
  return <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[#2c2832] hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
  >{children}</button>;
}

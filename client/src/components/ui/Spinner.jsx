import { twMerge } from "tailwind-merge";
import clsx from "clsx";

const SIZE_MAP = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

const COLOR_MAP = {
  primary: "border-primary-200 border-t-primary-600",
  white: "border-white/40 border-t-white",
  danger: "border-danger-200 border-t-danger-600",
  surface: "border-surface-300 border-t-surface-700",
};

export default function Spinner({ size = "md", color = "primary", className }) {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-block animate-spin rounded-full",
          SIZE_MAP[size] || SIZE_MAP.md,
          COLOR_MAP[color] || COLOR_MAP.primary
        ),
        className
      )}
      aria-label="Loading"
      role="status"
    />
  );
}

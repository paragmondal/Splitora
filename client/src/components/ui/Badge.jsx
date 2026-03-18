import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const VARIANT_MAP = {
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-700",
  danger: "bg-danger-100 text-danger-700",
  info: "bg-primary-100 text-primary-700",
  default: "bg-surface-200 text-surface-700",
};

const SIZE_MAP = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export default function Badge({ variant = "default", size = "md", className, children }) {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-full font-medium",
          VARIANT_MAP[variant] || VARIANT_MAP.default,
          SIZE_MAP[size] || SIZE_MAP.md
        ),
        className
      )}
    >
      {children}
    </span>
  );
}

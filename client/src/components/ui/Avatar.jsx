import clsx from "clsx";

const SIZE_MAP = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

export default function Avatar({ user, size = "md" }) {
  const initials = getInitials(user?.name || "User") || "U";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user?.name || "User avatar"}
        className={clsx("rounded-full object-cover", SIZE_MAP[size] || SIZE_MAP.md)}
      />
    );
  }

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-semibold text-white",
        SIZE_MAP[size] || SIZE_MAP.md
      )}
      aria-label={user?.name || "User avatar"}
    >
      {initials}
    </div>
  );
}

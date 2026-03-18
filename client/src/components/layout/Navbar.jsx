import { Bell, Menu } from "lucide-react";

export default function Navbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-200 bg-surface-50 px-4 md:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-surface-600 hover:bg-surface-100 hover:text-surface-900"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      <h2 className="text-base font-semibold text-surface-900">Splitora</h2>

      <button
        type="button"
        className="rounded-lg p-2 text-surface-600 hover:bg-surface-100 hover:text-surface-900"
        aria-label="Notifications"
      >
        <Bell size={20} />
      </button>
    </header>
  );
}

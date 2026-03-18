import { NavLink } from "react-router-dom";
import {
  ArrowLeftRight,
  CircleDollarSign,
  LayoutDashboard,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Avatar from "../ui/Avatar";

const navItems = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/groups", label: "Groups", Icon: Users },
  { to: "/settlements", label: "Settlements", Icon: ArrowLeftRight },
  { to: "/profile", label: "Profile", Icon: UserCircle },
];

export default function Sidebar({ user, mobile = false, onClose }) {
  const wrapperClass = mobile
    ? "fixed inset-y-0 left-0 z-50 w-64"
    : "hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-64";

  return (
    <aside className={wrapperClass}>
      <div className="flex h-full w-64 flex-col border-r border-surface-200 bg-surface-50 px-4 py-5 shadow-card">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <CircleDollarSign size={18} />
            </span>
            <h1 className="text-xl font-semibold text-surface-900">Splitora</h1>
          </div>

          {mobile ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-surface-500 hover:bg-surface-100 hover:text-surface-700"
              aria-label="Collapse sidebar"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-primary-100 text-primary-700"
                    : "text-surface-600 hover:bg-surface-100 hover:text-surface-900",
                ].join(" ")
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-100 px-3 py-2">
          <Avatar user={user} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-surface-900">{user?.name || "Guest User"}</p>
            <p className="truncate text-xs text-surface-500">{user?.email || "Not signed in"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

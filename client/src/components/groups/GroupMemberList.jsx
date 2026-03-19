import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

export default function GroupMemberList({ members = [] }) {
  if (!members.length) {
    return <p className="text-sm text-surface-600">No members yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {members.map((member) => {
        const user = member.user || member;
        const role = member.role || "member";

        return (
          <li
            key={member.id || member.userId || user.id}
            className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2"
          >
            <Avatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-surface-900">{user.name || "Member"}</p>
              <p className="truncate text-xs text-surface-500">{user.email || ""}</p>
            </div>
            <Badge variant={role === "admin" ? "info" : "default"} size="sm">
              {role}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import Card from "../ui/Card";
import { categoryConfig } from "../../utils/categoryConfig";

export default function GroupCard({ id, name, memberCount, recentActivity, category }) {
  const catKey = (category || "general").toLowerCase();
  const cat = categoryConfig[catKey] || categoryConfig.general;

  return (
    <Link to={`/groups/${id}`} className="block">
      <Card hover className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-surface-900">{name}</h3>
            {recentActivity ? <p className="mt-1 text-sm text-surface-600">{recentActivity}</p> : null}
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cat.color}`}>
            {cat.icon} {cat.label}
          </span>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 text-sm text-surface-600">
          <Users size={16} />
          <span>{memberCount || 0} members</span>
        </div>
      </Card>
    </Link>
  );
}

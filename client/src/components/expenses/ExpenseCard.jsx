import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, ClipboardCopy, Check, Pencil, Trash2 } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const CATEGORY_ICON_MAP = {
  food: "🍕",
  travel: "✈️",
  home: "🏠",
  event: "🎉",
  shopping: "🛍️",
  entertainment: "🎬",
  sports: "⚽",
  general: "💰",
};

const SPLIT_BADGE = {
  percentage: { label: "Percentage split", variant: "warning" },
  custom: { label: "Custom split", variant: "info" },
  equal: { label: "Equal split", variant: "success" },
};

const getSplitBadge = (splitType) => {
  const key = (splitType || "equal").toLowerCase();
  return SPLIT_BADGE[key] || SPLIT_BADGE.equal;
};

export default function ExpenseCard({ expense, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const shares = useMemo(() => expense?.shares || [], [expense]);
  const categoryKey = (expense?.category || "general").toLowerCase();
  const categoryIcon = CATEGORY_ICON_MAP[categoryKey] || "💰";
  const splitBadge = getSplitBadge(expense?.splitType);

  const handleCopy = (e) => {
    e.stopPropagation();
    const lines = [
      `${expense?.title} — ${formatCurrency(expense?.amount)}`,
      `Category: ${expense?.category || "general"}`,
      `Paid by: ${expense?.paidBy?.name || "Unknown"}`,
      `Date: ${format(new Date(expense?.date || expense?.createdAt), "dd MMM yyyy")}`,
      `Split: ${expense?.splitType || "equal"}`,
      expense?.note ? `Note: ${expense.note}` : null,
      "",
      "Shares:",
      ...shares.map(
        (s) => `  ${s.user?.name || "Member"}: ${formatCurrency(s.amount)}`
      ),
    ]
      .filter((l) => l !== null)
      .join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card hover className="group">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">
                {categoryIcon}
              </span>
              <h3 className="truncate text-base font-semibold text-surface-900">{expense?.title}</h3>
            </div>

            <p className="mt-1 text-sm text-surface-600">
              paid by <span className="font-medium">{expense?.paidBy?.name || "Unknown"}</span> •{" "}
              {format(new Date(expense?.date || expense?.createdAt), "dd MMM yyyy")}
            </p>
          </div>

          <div className="text-right">
            <p className="text-base font-bold text-surface-900">{formatCurrency(expense?.amount)}</p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <Badge variant={splitBadge.variant} size="sm">
                {splitBadge.label}
              </Badge>
              {expanded ? <ChevronUp size={16} className="text-surface-500" /> : <ChevronDown size={16} className="text-surface-500" />}
            </div>
          </div>
        </div>
      </button>

      <div className="mt-3 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 hover:text-primary-700"
          aria-label="Copy expense summary"
          title="Copy summary"
        >
          {copied ? <Check size={16} className="text-success-600" /> : <ClipboardCopy size={16} />}
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(expense)}
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 hover:text-primary-700"
          aria-label="Edit expense"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(expense)}
          className="rounded-lg p-2 text-surface-500 hover:bg-danger-50 hover:text-danger-700"
          aria-label="Delete expense"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-surface-200 pt-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-surface-500">Category: </span>
              <span className="font-medium text-surface-800 capitalize">{expense?.category || "general"}</span>
            </div>
            <div>
              <span className="text-surface-500">Paid by: </span>
              <span className="inline-flex items-center gap-1 font-medium text-surface-800">
                <Avatar user={expense?.paidBy} size="sm" />
                {expense?.paidBy?.name || "Unknown"}
              </span>
            </div>
            {expense?.note && (
              <div className="col-span-2">
                <span className="text-surface-500">Note: </span>
                <span className="text-surface-800">{expense.note}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-surface-600">Member shares</p>
            {shares.map((share) => (
              <div
                key={share.id || `${share.userId}-${share.amount}`}
                className="flex items-center justify-between rounded-xl bg-surface-100 px-3 py-2"
              >
                <div className="inline-flex items-center gap-2">
                  <Avatar user={share.user} size="sm" />
                  <span className="text-sm text-surface-800">{share.user?.name || "Member"}</span>
                </div>
                <span className="text-sm font-semibold text-surface-900">{formatCurrency(share.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

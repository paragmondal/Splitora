import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import useSettlements from "../../hooks/useSettlements";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function SettlementSuggestions({ groupId }) {
  const { suggestionsQuery, confirmSettlementMutation } = useSettlements({ groupId });
  const { data, isLoading } = suggestionsQuery;

  const suggestions = data?.data?.suggestions || [];

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-xl bg-surface-200" />;
  }

  if (!suggestions.length) {
    return <p className="text-sm text-surface-600">No settlement suggestions right now.</p>;
  }

  const handleConfirm = async (settlementId) => {
    const isConfirmed = window.confirm("Mark this settlement as completed?");
    if (!isConfirmed) {
      return;
    }

    try {
      await confirmSettlementMutation.mutateAsync(settlementId);
      toast.success("Settlement marked as completed");
      await suggestionsQuery.refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to confirm settlement");
    }
  };

  return (
    <div className="space-y-3">
      {suggestions.map((item, index) => (
        <Card key={`${item.from}-${item.to}-${index}`}>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-2">
              <Avatar user={item.fromUser} size="sm" />
              <span className="font-medium text-surface-900">{item.fromUser?.name || "Member"}</span>
            </div>
            <ArrowRight size={14} className="text-surface-400" />
            <div className="inline-flex items-center gap-2">
              <Avatar user={item.toUser} size="sm" />
              <span className="font-medium text-surface-900">{item.toUser?.name || "Member"}</span>
            </div>
            <span className="text-surface-600">pays</span>
            <span className="font-semibold text-primary-700">{formatCurrency(item.amount)}</span>
            <Button
              size="sm"
              className="ml-auto"
              loading={confirmSettlementMutation.isPending}
              onClick={() => handleConfirm(item.settlementId)}
            >
              Mark as Settled
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

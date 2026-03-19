import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSettlement, confirmSettlement } from "../../api/settlements.api";
import { useSettlementSuggestions } from "../../hooks/useSettlements";
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
  const queryClient = useQueryClient();
  const { data, isLoading } = useSettlementSuggestions(groupId);

  const markSettledMutation = useMutation({
    mutationFn: async ({ from, to, amount }) => {
      const created = await createSettlement({
        groupId,
        payerId: from,
        receiverId: to,
        amount,
      });
      const settlementId = created?.data?.settlement?.id;
      if (settlementId) {
        await confirmSettlement(settlementId);
      }
    },
    onSuccess: () => {
      toast.success("Settlement recorded");
      queryClient.invalidateQueries({ queryKey: ["settlement-suggestions", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to record settlement");
    },
  });

  const suggestions = data?.data?.suggestions || [];

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-xl bg-surface-200" />;
  }

  if (!suggestions.length) {
    return (
      <p className="text-sm text-surface-600 py-4 text-center">
        All settled up! 🎉
      </p>
    );
  }

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
              loading={markSettledMutation.isPending}
              onClick={() =>
                markSettledMutation.mutate({
                  from: item.from,
                  to: item.to,
                  amount: item.amount,
                })
              }
            >
              Mark Settled
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

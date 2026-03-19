import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SettlementCard from "../components/settlements/SettlementCard";
import { useGroups } from "../hooks/useGroups";
import { getGroupSettlements } from "../api/settlements.api";

const FILTERS = ["all", "pending", "completed"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function SettlementsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: groupsData, isLoading: groupsLoading } = useGroups();
  const groups = groupsData?.data?.groups || [];

  const settlementQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ["settlements", group.id],
      queryFn: () => getGroupSettlements(group.id),
      enabled: Boolean(group.id),
    })),
  });

  const isLoading = groupsLoading || settlementQueries.some((q) => q.isLoading);

  const allSettlements = useMemo(() => {
    return groups.flatMap((group, idx) => {
      const raw = settlementQueries[idx]?.data?.data?.settlements || [];
      return raw.map((s) => ({ ...s, group }));
    });
  }, [groups, settlementQueries]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return allSettlements;
    return allSettlements.filter(
      (s) => (s.status || "pending").toLowerCase() === activeFilter
    );
  }, [allSettlements, activeFilter]);

  const groupedSettlements = useMemo(() => {
    return filtered.reduce((acc, settlement) => {
      const groupName = settlement?.group?.name || "Ungrouped";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(settlement);
      return acc;
    }, {});
  }, [filtered]);

  const totalPendingAmount = useMemo(
    () =>
      allSettlements
        .filter((s) => (s.status || "pending").toLowerCase() === "pending")
        .reduce((sum, s) => sum + Number(s.amount || 0), 0),
    [allSettlements]
  );

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface-200" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-bold text-surface-900">Settlements</h1>
        <p className="mt-2 text-sm text-surface-600">Track all your settlements across groups.</p>
        <div className="mt-4 inline-flex items-center rounded-xl bg-warning-100 px-3 py-2 text-sm font-semibold text-warning-700">
          Total pending: {formatCurrency(totalPendingAmount)}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter}
            size="sm"
            variant={activeFilter === filter ? "primary" : "outline"}
            onClick={() => setActiveFilter(filter)}
          >
            {filter[0].toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </div>

      {Object.keys(groupedSettlements).length ? (
        <div className="space-y-6">
          {Object.entries(groupedSettlements).map(([groupName, groupSettlements]) => (
            <Card key={groupName}>
              <h2 className="mb-4 text-lg font-semibold text-surface-900">{groupName}</h2>
              <div className="space-y-3">
                {groupSettlements.map((settlement) => (
                  <SettlementCard key={settlement.id} settlement={settlement} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-surface-600">No settlements found for this filter.</p>
        </Card>
      )}
    </div>
  );
}

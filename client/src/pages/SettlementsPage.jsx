import { useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SettlementCard from "../components/settlements/SettlementCard";
import useSettlements from "../hooks/useSettlements";

const FILTERS = ["all", "pending", "completed"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function SettlementsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const { settlementsQuery } = useSettlements({ status: activeFilter });
  const { data, isLoading } = settlementsQuery;

  const settlements = data?.data?.settlements || data?.data || [];

  const groupedSettlements = useMemo(() => {
    return settlements.reduce((acc, settlement) => {
      const groupName = settlement?.group?.name || settlement?.groupName || "Ungrouped";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(settlement);
      return acc;
    }, {});
  }, [settlements]);

  const totalPendingAmount = useMemo(
    () =>
      settlements
        .filter((settlement) => (settlement?.status || "pending").toLowerCase() === "pending")
        .reduce((sum, settlement) => sum + Number(settlement?.amount || 0), 0),
    [settlements]
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

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Check, ChevronDown, ChevronUp, ClipboardCopy, Link2, Plus, Search, X } from "lucide-react";
import { format } from "date-fns";
import { addMember, getGroupById } from "../api/groups.api";
import { getGroupSettlements } from "../api/settlements.api";
import { generateInviteCode } from "../api/user.api";
import useAuth from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ExpenseCard from "../components/expenses/ExpenseCard";
import AddExpenseModal from "../components/expenses/AddExpenseModal";
import SettlementSuggestions from "../components/settlements/SettlementSuggestions";
import AddMemberModal from "../components/groups/AddMemberModal";
import { categoryConfig } from "../utils/categoryConfig";

const TABS = ["expenses", "balances", "settlements"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest", label: "Lowest amount" },
];

const EXPENSE_CATEGORIES = ["all", "food", "travel", "home", "event", "shopping", "entertainment", "sports", "general"];

export default function GroupDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("expenses");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [settlementFilter, setSettlementFilter] = useState("all");

  // Expense search/filter state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["groups", id],
    queryFn: () => getGroupById(id),
    enabled: Boolean(id),
  });

  const { data: settlementsData } = useQuery({
    queryKey: ["settlements", id],
    queryFn: () => getGroupSettlements(id),
    enabled: Boolean(id),
  });

  const addMemberMutation = useMutation({
    mutationFn: (email) => addMember(id, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", id] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Member added successfully");
      setIsAddMemberOpen(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to add member");
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => generateInviteCode(id),
    onSuccess: (data) => {
      const code = data?.data?.group?.inviteCode;
      if (code) {
        const link = `${window.location.origin}/join/${code}`;
        setInviteLink(link);
        setIsInviteOpen(true);
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to generate invite link");
    },
  });

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const group = data?.data?.group;

  const balances = useMemo(() => {
    if (!group) return [];
    const { members, expenses = [] } = group;
    if (!members) return [];

    const balanceMap = {};
    for (const member of members) {
      balanceMap[member.userId || member.user?.id] = 0;
    }
    for (const expense of expenses) {
      const paidById = expense.paidById || expense.paidBy?.id;
      if (paidById) balanceMap[paidById] = (balanceMap[paidById] || 0) + Number(expense.amount);
      for (const share of expense.shares || []) {
        const uid = share.userId || share.user?.id;
        if (uid) balanceMap[uid] = (balanceMap[uid] || 0) - Number(share.amount);
      }
    }

    return members.map((member) => {
      const uid = member.userId || member.user?.id;
      return {
        userId: uid,
        name: member.user?.name || "Member",
        avatar: member.user?.avatar || null,
        balance: balanceMap[uid] || 0,
      };
    });
  }, [group]);

  const totalGroupSpending = useMemo(
    () => (group?.expenses || []).reduce((sum, e) => sum + Number(e.amount), 0),
    [group]
  );

  const filteredExpenses = useMemo(() => {
    let list = group?.expenses || [];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.title?.toLowerCase().includes(q));
    }

    if (categoryFilter !== "all") {
      list = list.filter((e) => (e.category || "general").toLowerCase() === categoryFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((e) => new Date(e.date || e.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((e) => new Date(e.date || e.createdAt) <= to);
    }

    list = [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
      if (sortBy === "oldest") return new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt);
      if (sortBy === "highest") return Number(b.amount) - Number(a.amount);
      if (sortBy === "lowest") return Number(a.amount) - Number(b.amount);
      return 0;
    });

    return list;
  }, [group, search, categoryFilter, dateFrom, dateTo, sortBy]);

  const hasActiveFilters = search || categoryFilter !== "all" || dateFrom || dateTo || sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
  };

  const members = useMemo(() => group?.members || [], [group]);
  const allSettled = balances.length > 0 && balances.every((b) => Math.abs(b.balance) < 0.01);

  const settlements = useMemo(() => {
    const list = settlementsData?.data?.settlements || [];
    if (settlementFilter === "all") return list;
    return list.filter((s) => s.status === settlementFilter);
  }, [settlementsData, settlementFilter]);

  const catKey = (group?.category || "general").toLowerCase();
  const cat = categoryConfig[catKey] || categoryConfig.general;

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-surface-200" />;
  }

  if (!group) {
    return (
      <Card>
        <p className="text-sm text-surface-600">Group not found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{cat.icon}</span>
              <h1 className="text-2xl font-bold text-surface-900">{group.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cat.color}`}>
                {cat.label}
              </span>
            </div>
            {group.description ? <p className="mt-2 text-sm text-surface-600">{group.description}</p> : null}

            <div className="mt-4 flex items-center gap-2">
              {members.map((member) => (
                <Avatar key={member.id || member.userId} user={member.user} size="sm" />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<Link2 size={16} />}
              onClick={() => inviteMutation.mutate()}
              loading={inviteMutation.isPending}
            >
              Invite
            </Button>
            <Button variant="outline" leftIcon={<Plus size={16} />} onClick={() => setIsAddMemberOpen(true)}>
              Add Member
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => setIsAddExpenseOpen(true)}>
              Add Expense
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {activeTab === "expenses" ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search expenses…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-surface-300 bg-surface-50 pl-8 pr-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-surface-700 hover:bg-surface-100"
              >
                Filters {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-lg bg-danger-50 px-2 py-2 text-xs text-danger-600 hover:bg-danger-100"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-9 w-full rounded-lg border border-surface-300 bg-surface-50 px-2 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c === "all" ? "All categories" : c[0].toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">From date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 w-full rounded-lg border border-surface-300 bg-surface-50 px-2 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">To date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 w-full rounded-lg border border-surface-300 bg-surface-50 px-2 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-600">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-9 w-full rounded-lg border border-surface-300 bg-surface-50 px-2 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </Card>

          {filteredExpenses.length ? (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-sm text-surface-600">
                {hasActiveFilters ? "No expenses match your filters." : "No expenses added yet."}
              </p>
            </Card>
          )}
        </div>
      ) : null}

      {activeTab === "balances" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
            <p className="text-sm text-surface-600">Total group spending</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">{formatCurrency(totalGroupSpending)}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card>
              <p className="text-xs text-surface-600">Total Expenses</p>
              <p className="mt-1 text-lg font-bold text-surface-900">{group?.expenses?.length || 0}</p>
            </Card>
            <Card>
              <p className="text-xs text-surface-600">You Owe</p>
              <p className="mt-1 text-lg font-bold text-danger-600">
                {formatCurrency(Math.max(0, -(balances.find((b) => b.userId === user?.id)?.balance || 0)))}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-surface-600">Owed to You</p>
              <p className="mt-1 text-lg font-bold text-success-600">
                {formatCurrency(Math.max(0, balances.find((b) => b.userId === user?.id)?.balance || 0))}
              </p>
            </Card>
          </div>

          {allSettled && (
            <div className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
              <Check size={16} /> All settled up! 🎉
            </div>
          )}

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-surface-900">Member balances</h2>
            <div className="space-y-3">
              {balances.length ? (
                balances.map((entry) => {
                  const share = totalGroupSpending > 0 ? Math.abs(entry.balance) / totalGroupSpending : 0;
                  return (
                    <div key={entry.userId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2">
                          <Avatar user={{ name: entry.name, avatar: entry.avatar }} size="sm" />
                          <span className="text-sm font-medium text-surface-900">{entry.name}</span>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            entry.balance >= 0 ? "text-success-600" : "text-danger-600"
                          }`}
                        >
                          {entry.balance >= 0 ? "+" : ""}{formatCurrency(entry.balance)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-200">
                        <div
                          className={`h-1.5 rounded-full ${entry.balance >= 0 ? "bg-success-400" : "bg-danger-400"}`}
                          style={{ width: `${Math.min(100, share * 100).toFixed(1)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-surface-600">No balances available yet.</p>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "settlements" ? (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-surface-900">Settlement suggestions</h2>
            <SettlementSuggestions groupId={id} />
          </Card>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-surface-900">Settlement History</h2>
              <div className="flex gap-1">
                {["all", "pending", "completed"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSettlementFilter(filter)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      settlementFilter === filter
                        ? "bg-primary-600 text-white"
                        : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                    }`}
                  >
                    {filter[0].toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {settlements.length === 0 ? (
              <p className="py-4 text-center text-sm text-surface-600">No settlement history yet.</p>
            ) : (
              <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-0 before:h-full before:w-0.5 before:bg-surface-200">
                {settlements.map((s) => (
                  <div key={s.id} className="relative">
                    <div className="absolute -left-4 top-3 h-3 w-3 rounded-full border-2 border-primary-400 bg-white" />
                    <div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-surface-500">
                          {format(new Date(s.createdAt), "dd MMM yyyy")}
                        </p>
                        <Badge variant={s.status === "completed" ? "success" : "warning"} size="sm">
                          {s.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <div className="inline-flex items-center gap-1">
                          <Avatar user={s.payer} size="sm" />
                          <span className="font-medium">{s.payer?.name || "Payer"}</span>
                        </div>
                        <span className="text-surface-500">paid</span>
                        <span className="font-semibold text-primary-700">{formatCurrency(s.amount)}</span>
                        <span className="text-surface-500">to</span>
                        <div className="inline-flex items-center gap-1">
                          <Avatar user={s.receiver} size="sm" />
                          <span className="font-medium">{s.receiver?.name || "Receiver"}</span>
                        </div>
                        {s.paymentMethod && (
                          <Badge variant="default" size="sm">{s.paymentMethod}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* Floating Action Button */}
      <div className="group fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
          aria-label="Add expense"
        >
          <Plus size={24} />
        </button>
        <span className="pointer-events-none absolute bottom-16 right-0 rounded-lg bg-surface-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
          Add expense
        </span>
      </div>

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSubmit={(email) => addMemberMutation.mutateAsync(email)}
        loading={addMemberMutation.isPending}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groupId={id}
        members={members}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["groups", id] });
          queryClient.invalidateQueries({ queryKey: ["expenses", id] });
        }}
      />

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Members" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-surface-600">Share this link to invite people to join the group:</p>
          <div className="flex items-center gap-2 rounded-xl border border-surface-300 bg-surface-50 px-3 py-2">
            <span className="flex-1 truncate text-sm text-surface-800">{inviteLink}</span>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="flex-shrink-0 rounded-lg p-1.5 text-surface-600 hover:bg-surface-200"
            >
              {copied ? <Check size={16} className="text-success-600" /> : <ClipboardCopy size={16} />}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<ClipboardCopy size={14} />}
              onClick={handleCopyInvite}
            >
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent("Join my Splitora group: " + inviteLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Share via WhatsApp
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}

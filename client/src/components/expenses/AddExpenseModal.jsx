import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import SplitTypeSelector from "./SplitTypeSelector";
import { createExpense } from "../../api/expenses.api";

const CATEGORIES = ["general", "food", "travel", "home", "event"];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toFixedNumber = (value) => Number(toNumber(value).toFixed(2));
const getMemberId = (member) => member?.user?.id || member?.userId || member?.id;
const getMemberName = (member) => member?.user?.name || member?.name || "Member";

export default function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  members = [],
  onCreated,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "general",
    date: new Date().toISOString().slice(0, 10),
    paidById: "",
    splitType: "equal",
    selectedMemberIds: [],
    splits: {},
  });

  const normalizedMembers = useMemo(
    () =>
      members
        .map((member) => ({
          id: getMemberId(member),
          name: getMemberName(member),
          raw: member,
        }))
        .filter((member) => Boolean(member.id)),
    [members]
  );

  const selectedMembers = useMemo(
    () => normalizedMembers.filter((member) => form.selectedMemberIds.includes(member.id)),
    [form.selectedMemberIds, normalizedMembers]
  );

  const resetForm = () => {
    setForm({
      title: "",
      amount: "",
      category: "general",
      date: new Date().toISOString().slice(0, 10),
      paidById: "",
      splitType: "equal",
      selectedMemberIds: [],
      splits: {},
    });
  };

  const handleToggleMember = (memberId) => {
    setForm((prev) => {
      const exists = prev.selectedMemberIds.includes(memberId);
      const selectedMemberIds = exists
        ? prev.selectedMemberIds.filter((id) => id !== memberId)
        : [...prev.selectedMemberIds, memberId];

      return {
        ...prev,
        selectedMemberIds,
      };
    });
  };

  const validateAndBuildPayload = () => {
    const title = form.title.trim();
    const amount = toFixedNumber(form.amount);

    if (!title) {
      throw new Error("Title is required");
    }

    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!form.paidById) {
      throw new Error("Please select who paid");
    }

    if (!form.selectedMemberIds.length) {
      throw new Error("Please select at least one member to split among");
    }

    const payload = {
      groupId,
      title,
      amount,
      category: form.category,
      date: form.date,
      paidById: form.paidById,
      splitType: form.splitType,
    };

    if (form.splitType === "equal") {
      payload.memberIds = form.selectedMemberIds;
      return payload;
    }

    if (form.splitType === "percentage") {
      const shares = form.selectedMemberIds.map((userId) => ({
        userId,
        percentage: toFixedNumber(form.splits[userId]),
      }));

      const totalPercentage = shares.reduce((sum, item) => sum + item.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.001) {
        throw new Error("Percentage split must total 100%");
      }

      payload.shares = shares;
      return payload;
    }

    const shares = form.selectedMemberIds.map((userId) => ({
      userId,
      amount: toFixedNumber(form.splits[userId]),
    }));

    const totalCustom = toFixedNumber(shares.reduce((sum, item) => sum + item.amount, 0));
    if (Math.abs(totalCustom - amount) > 0.001) {
      throw new Error("Custom split total must match expense amount");
    }

    payload.shares = shares;
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const payload = validateAndBuildPayload();
      const response = await createExpense(payload);

      toast.success("Expense created successfully");
      onCreated?.(response?.data?.expense || response?.expense || null);
      resetForm();
      onClose?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Failed to create expense");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMemberObjects = selectedMembers.map((member) => member.raw);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Title"
            placeholder="Dinner at Fisherman's Wharf"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />

          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">Category</label>
            <select
              className="h-11 w-full rounded-xl border border-surface-300 bg-surface-50 px-3 text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category[0].toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          />

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-surface-700">Paid by</label>
            <select
              className="h-11 w-full rounded-xl border border-surface-300 bg-surface-50 px-3 text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
              value={form.paidById}
              onChange={(e) => setForm((prev) => ({ ...prev, paidById: e.target.value }))}
            >
              <option value="">Select member</option>
              {normalizedMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-surface-700">Split among</label>
          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-surface-200 bg-surface-50 p-3 sm:grid-cols-2">
            {normalizedMembers.map((member) => {
              const checked = form.selectedMemberIds.includes(member.id);

              return (
                <label
                  key={member.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    checked
                      ? "border-primary-300 bg-primary-50 text-primary-700"
                      : "border-surface-200 bg-surface-50 text-surface-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleMember(member.id)}
                    className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-200"
                  />
                  <span>{member.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <SplitTypeSelector
          splitType={form.splitType}
          onChange={(nextType) => setForm((prev) => ({ ...prev, splitType: nextType }))}
          members={selectedMemberObjects}
          totalAmount={toNumber(form.amount)}
          splits={form.splits}
          onSplitsChange={(nextSplits) => setForm((prev) => ({ ...prev, splits: nextSplits }))}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}

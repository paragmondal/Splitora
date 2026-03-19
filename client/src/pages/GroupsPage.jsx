import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { createGroup, getMyGroups } from "../api/groups.api";
import GroupCard from "../components/groups/GroupCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import { categoryConfig } from "../utils/categoryConfig";

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "general",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: getMyGroups,
  });

  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created successfully");
      setIsModalOpen(false);
      setForm({ name: "", description: "", category: "general" });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create group");
    },
  });

  const groups = data?.data?.groups || [];

  const handleCreateGroup = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    createGroupMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-surface-900">My Groups</h1>
        <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
          Create Group
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-32 animate-pulse rounded-2xl bg-surface-200" />
          ))}
        </div>
      ) : groups.length ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              id={group.id}
              name={group.name}
              memberCount={group.memberCount}
              recentActivity={`Updated ${new Date(group.updatedAt || group.createdAt).toLocaleDateString()}`}
              category={group.category}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No groups yet"
          description="Create your first group to start splitting expenses with friends, family, or teammates."
          action={{
            label: "Create Group",
            onClick: () => setIsModalOpen(true),
          }}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Group" size="sm">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            label="Group name"
            placeholder="Goa Trip 2024"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />

          <Input
            label="Description"
            placeholder="Optional description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-surface-700">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(categoryConfig).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, category: key }))}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2 text-xs font-medium transition-colors ${
                    form.category === key
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-surface-200 bg-surface-50 text-surface-700 hover:border-surface-300"
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createGroupMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

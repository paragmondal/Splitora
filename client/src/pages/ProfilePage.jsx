import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import { useGroups } from "../hooks/useGroups";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const editNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: groupsData } = useGroups();

  const groups = groupsData?.data?.groups || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editNameSchema),
    defaultValues: { name: user?.name || "" },
  });

  const onSubmit = async () => {
    toast("Profile editing coming soon", { icon: "ℹ️" });
  };

  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), "MMMM yyyy")
    : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:items-start sm:py-6">
        <Avatar user={user} size="xl" />
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{user?.name || "User"}</h1>
          <p className="text-sm text-surface-600">{user?.email}</p>
          <p className="mt-1 text-xs text-surface-500">Member since {memberSince}</p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-surface-900">Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-surface-100 p-4 text-center">
            <p className="text-2xl font-bold text-surface-900">{groups.length}</p>
            <p className="mt-1 text-sm text-surface-600">Groups</p>
          </div>
          <div className="rounded-xl bg-surface-100 p-4 text-center">
            <p className="text-2xl font-bold text-surface-900">
              {groups.reduce((sum, g) => sum + (g._count?.expenses || 0), 0)}
            </p>
            <p className="mt-1 text-sm text-surface-600">Total Expenses</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-surface-900">Edit Profile</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            placeholder="Your name"
            error={errors.name?.message}
            {...register("name")}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-danger-600">Danger Zone</h2>
        <p className="mb-4 text-sm text-surface-600">Sign out of your account on this device.</p>
        <Button variant="danger" onClick={logout}>
          Log Out
        </Button>
      </Card>
    </div>
  );
}

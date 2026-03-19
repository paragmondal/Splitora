import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import { useGroups } from "../hooks/useGroups";
import { updateProfile, updatePassword } from "../api/user.api";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4",
];

const editNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: groupsData } = useGroups();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const groups = groupsData?.data?.groups || [];
  const totalExpenses = groups.reduce((sum, g) => sum + (g._count?.expenses || 0), 0);

  const {
    register: registerName,
    handleSubmit: handleSubmitName,
    formState: { errors: nameErrors },
  } = useForm({
    resolver: zodResolver(editNameSchema),
    defaultValues: { name: user?.name || "" },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  const onSaveName = async (values) => {
    setSavingProfile(true);
    try {
      await updateProfile({ name: values.name, avatar: selectedColor || user?.avatar });
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (values) => {
    try {
      await updatePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success("Password changed successfully");
      resetPassword();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    }
  };

  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), "MMMM yyyy")
    : "—";

  const displayAvatar = selectedColor
    ? { ...user, avatar: selectedColor }
    : user;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:items-start sm:py-6">
        <div className="relative">
          <button type="button" onClick={() => setShowColorPicker((v) => !v)} className="focus:outline-none">
            <Avatar user={displayAvatar} size="xl" />
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs text-white shadow">
              ✏️
            </span>
          </button>
          {showColorPicker && (
            <div className="absolute left-0 top-full z-10 mt-2 flex gap-2 rounded-xl border border-surface-200 bg-white p-3 shadow-lg">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => { setSelectedColor(color); setShowColorPicker(false); }}
                  className="h-7 w-7 rounded-full ring-2 ring-offset-1 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    outlineColor:
                      selectedColor === color || (user?.avatar === color && !selectedColor)
                        ? color
                        : "transparent",
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{user?.name || "User"}</h1>
          <p className="text-sm text-surface-600">{user?.email}</p>
          <p className="mt-1 text-xs text-surface-500">Member since {memberSince}</p>
        </div>
      </Card>

      {/* Stats Cards */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-surface-900">Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-surface-100 p-4 text-center">
            <p className="text-2xl font-bold text-surface-900">{groups.length}</p>
            <p className="mt-1 text-sm text-surface-600">Groups joined</p>
          </div>
          <div className="rounded-xl bg-surface-100 p-4 text-center">
            <p className="text-2xl font-bold text-surface-900">{totalExpenses}</p>
            <p className="mt-1 text-sm text-surface-600">Total Expenses</p>
          </div>
          <div className="rounded-xl bg-surface-100 p-4 text-center">
            <p className="text-2xl font-bold text-surface-900">—</p>
            <p className="mt-1 text-sm text-surface-600">Total Settled</p>
          </div>
        </div>
      </Card>

      {/* Edit Name */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-surface-900">Edit Profile</h2>
        <form onSubmit={handleSubmitName(onSaveName)} className="space-y-4">
          <Input
            label="Name"
            placeholder="Your name"
            error={nameErrors.name?.message}
            {...registerName("name")}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-surface-900">Change Password</h2>
        <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            placeholder="••••••••"
            error={passwordErrors.currentPassword?.message}
            {...registerPassword("currentPassword")}
          />
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            error={passwordErrors.newPassword?.message}
            {...registerPassword("newPassword")}
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword("confirmPassword")}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={isPasswordSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card>
        <h2 className="mb-2 text-lg font-semibold text-danger-600">Danger Zone</h2>
        <p className="mb-4 text-sm text-surface-600">Sign out of your account on this device.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={logout}>
            Log Out
          </Button>
          <Button variant="outline" onClick={() => setIsLeaveConfirmOpen(true)} className="border-danger-300 text-danger-600 hover:bg-danger-50">
            Leave All Groups
          </Button>
        </div>
      </Card>

      <Modal isOpen={isLeaveConfirmOpen} onClose={() => setIsLeaveConfirmOpen(false)} title="Leave All Groups" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-surface-700">
            Are you sure you want to leave all groups? This action cannot be undone and you will lose access to all
            shared expenses.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsLeaveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setIsLeaveConfirmOpen(false);
                toast("Feature coming soon", { icon: "ℹ️" });
              }}
            >
              Leave All Groups
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

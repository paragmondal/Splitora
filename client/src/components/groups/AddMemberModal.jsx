import { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function AddMemberModal({ isOpen, onClose, onSubmit, loading = false }) {
  const [email, setEmail] = useState("");

  const handleClose = () => {
    setEmail("");
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }

    await onSubmit?.(email.trim());
    setEmail("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Member" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Member email"
          type="email"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}

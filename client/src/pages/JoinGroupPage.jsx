import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { joinByInviteCode } from "../api/user.api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function JoinGroupPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    if (!code) {
      // Defer state update outside of strict effect body
      const t = setTimeout(() => setStatus("error"), 0);
      return () => clearTimeout(t);
    }

    joinByInviteCode(code)
      .then((res) => {
        const group = res?.data?.group;
        setGroupName(group?.name || "the group");
        setGroupId(group?.id || "");
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [code]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-300 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <Card className="text-center">
        {status === "success" ? (
          <>
            <div className="mb-4 text-5xl">🎉</div>
            <h1 className="text-xl font-bold text-surface-900">You joined {groupName}!</h1>
            <p className="mt-2 text-sm text-surface-600">
              You have been added as a member. Start splitting expenses with the group.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => navigate(groupId ? `/groups/${groupId}` : "/groups")}>
                Go to Group
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Go to Dashboard
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 text-5xl">❌</div>
            <h1 className="text-xl font-bold text-surface-900">Invalid or expired invite link</h1>
            <p className="mt-2 text-sm text-surface-600">
              This invite link is no longer valid. Ask the group admin to generate a new one.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

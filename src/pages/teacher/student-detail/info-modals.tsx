import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function StudentInviteModal({
  open,
  studentName,
  studentId,
  onClose,
}: {
  open: boolean;
  studentName: string;
  studentId: string;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create student account"
      description="Student accounts are created once by the admin — there is no open sign-up in this app."
      footer={
        <Button variant="ghost" onClick={onClose}>Close</Button>
      }
    >
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">1.</span> Ask the admin to
          create the login for <span className="font-semibold text-foreground">{studentName}</span>{" "}
          (student id: <span className="font-mono text-xs">{studentId}</span>).
        </p>
        <p>
          <span className="font-semibold text-foreground">2.</span> Give the student
          their email and temporary password.
        </p>
        <p>
          <span className="font-semibold text-foreground">3.</span> They sign in on
          the login page and change the password afterwards.
        </p>
        <details className="rounded-xl border border-border bg-surface-muted px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-foreground">
            Show admin command
          </summary>
          <code className="mt-2 block select-all whitespace-pre-wrap break-all font-mono text-xs text-foreground">
            node --experimental-strip-types scripts/create-student.ts --name "{studentName}" --email student@example.com --password "change-me" --student-id {studentId}
          </code>
        </details>
      </div>
    </Modal>
  );
}

export function StudentBlockModal({
  open,
  blocked,
  name,
  blocking,
  onClose,
  onConfirm,
}: {
  open: boolean;
  blocked: boolean;
  name: string;
  blocking: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={blocked ? "Unblock this student?" : "Block this student?"}
      description={
        blocked
          ? `${name} will regain access to the app right away.`
          : `${name} will be locked out of the app immediately until you unblock them. Their data stays intact.`
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant={blocked ? "primary" : "danger"}
            loading={blocking}
            onClick={onConfirm}
          >
            {blocked ? "Unblock" : "Block"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {blocked ? "Confirm unblock." : "This cannot be undone except by unblocking again."}
      </p>
    </Modal>
  );
}

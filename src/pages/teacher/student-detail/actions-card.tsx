import { MessageSquare, CreditCard, ShieldCheck, Ban, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StudentActionsCard({
  blocked,
  onChat,
  onNewPayment,
  onBlock,
  onDelete,
}: {
  blocked: boolean;
  onChat: () => void;
  onNewPayment: () => void;
  onBlock: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader title="Quick actions" />
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <Button variant="secondary" onClick={onChat} leftIcon={<MessageSquare className="h-4 w-4" aria-hidden />}>
          Open chat
        </Button>
        <Button
          variant="secondary"
          onClick={onNewPayment}
          leftIcon={<CreditCard className="h-4 w-4" aria-hidden />}
        >
          New payment
        </Button>
        {blocked ? (
          <Button
            variant="secondary"
            onClick={onBlock}
            leftIcon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          >
            Unblock student
          </Button>
        ) : (
          <Button
            variant="danger"
            onClick={onBlock}
            leftIcon={<Ban className="h-4 w-4" aria-hidden />}
          >
            Block student
          </Button>
        )}
        <Button
          variant="danger"
          onClick={onDelete}
          leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
        >
          Remove student
        </Button>
      </CardContent>
    </Card>
  );
}

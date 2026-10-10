import { Mail, ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TEACHER_EMAIL = "lerguethafsa@gmail.com";
const GMAIL_URL = `https://mail.google.com/mail/?view=cm&to=${TEACHER_EMAIL}`;

export function StudentChatPage() {
  return (
    <div>
      <PageHeader title="Messages" description="Reach your teacher directly." />

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Mail className="h-7 w-7" aria-hidden />
          </span>
          <p className="text-base font-semibold text-foreground">Contact Miss Hafsa</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Send her an email at{" "}
            <a href={`mailto:${TEACHER_EMAIL}`} className="font-medium text-primary hover:underline">
              {TEACHER_EMAIL}
            </a>{" "}
            — she replies as soon as she can.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <a href={`mailto:${TEACHER_EMAIL}?subject=${encodeURIComponent("Question from a Purple World student")}`}>
              <Button leftIcon={<Mail className="h-4 w-4" aria-hidden />}>
                Open mail app
              </Button>
            </a>
            <a href={GMAIL_URL} target="_blank" rel="noreferrer">
              <Button variant="secondary" leftIcon={<ExternalLink className="h-4 w-4" aria-hidden />}>
                Open Gmail
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

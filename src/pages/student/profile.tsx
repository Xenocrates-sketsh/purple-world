import { useState } from "react";

import { useAuth } from "@/lib/auth";
import { useDoc } from "@/hooks/useFirestore";
import { paths } from "@/lib/db/paths";
import { useToast } from "@/lib/toast";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, GraduationCap, GitBranch, Phone } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

export function StudentProfilePage() {
  const { user, userDoc } = useAuth();
  const { toast } = useToast();
  const student = useDoc(
    userDoc?.studentId ? paths.students(userDoc.studentId) : null
  );
  const [updatingPrefs, setUpdatingPrefs] = useState(false);

  async function toggleNotifications(enabled: boolean) {
    if (!user) return;
    setUpdatingPrefs(true);
    try {
      await updateDoc(doc(getFirestoreDb(), paths.users(user.uid)), {
        prefs: {
          notifications: enabled,
          language: userDoc?.prefs?.language ?? "fr",
        },
      });
      toast(enabled ? "Notifications on" : "Notifications off", { variant: "info" });
    } catch {
      toast("Could not update preferences", { variant: "error" });
    } finally {
      setUpdatingPrefs(false);
    }
  }

  const d = student.doc?.data;

  return (
    <div>
      <PageHeader title="My profile" description="Your details and notification preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProfileForm />
          <Card>
            <CardHeader title="Student details" />
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <School className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">School</p>
                  <p className="text-sm font-medium text-foreground">{d?.school ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GitBranch className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">BAC stream</p>
                  <p className="text-sm font-medium text-foreground">{d?.stream ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">BAC year</p>
                  <p className="text-sm font-medium text-foreground">{d?.bacInfo.year ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Target score</p>
                  <p className="text-sm font-medium text-foreground">
                    {d?.bacInfo.targetScore != null ? `${d.bacInfo.targetScore} / 20` : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader title="Notifications" description="In-app alerts when something new lands." />
          <CardContent>
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Notify me of new activity</p>
                <p className="text-xs text-muted-foreground">
                  New exercises, announcements, grades and messages.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={userDoc?.prefs?.notifications ?? true}
                disabled={updatingPrefs}
                onClick={() => toggleNotifications(!(userDoc?.prefs?.notifications ?? true))}
                className={
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 " +
                  (userDoc?.prefs?.notifications ?? true ? "bg-primary" : "bg-surface-muted")
                }
              >
                <span
                  className={
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all " +
                    (userDoc?.prefs?.notifications ?? true ? "left-[22px]" : "left-0.5")
                  }
                />
              </button>
            </label>
            <p className="mt-4 text-xs text-muted-foreground">
              <Badge variant="neutral">Student</Badge> account · email {user?.email}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
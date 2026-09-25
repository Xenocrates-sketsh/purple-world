import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";

import { useAuth } from "@/lib/auth";
import { getFirestoreDb } from "@/lib/firebase";
import { paths } from "@/lib/db/paths";
import { useToast } from "@/lib/toast";
import { APP_NAME, IS_PRODUCTION } from "@/lib/config";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { SecurityCard } from "@/components/settings/security-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StudentSettingsPage() {
  const { user, userDoc } = useAuth();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const enabled = userDoc?.prefs?.notifications ?? true;

  async function toggle(enabled: boolean) {
    if (!user) return;
    setUpdating(true);
    try {
      await updateDoc(doc(getFirestoreDb(), paths.users(user.uid)), {
        prefs: { notifications: enabled, language: userDoc?.prefs?.language ?? "fr" },
      });
      toast(enabled ? "Notifications on" : "Notifications off", { variant: "info" });
    } catch {
      toast("Could not update preferences", { variant: "error" });
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Your account and app details." />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm />

        <div className="space-y-6">
          <SecurityCard />
          <Card>
            <CardHeader title="Notifications" description="In-app alerts for new activity." />
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
                  aria-checked={enabled}
                  disabled={updating}
                  onClick={() => toggle(!enabled)}
                  className={
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 " +
                    (enabled ? "bg-primary" : "bg-surface-muted")
                  }
                >
                  <span
                    className={
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all " +
                      (enabled ? "left-[22px]" : "left-0.5")
                    }
                  />
                </button>
              </label>
              <p className="mt-4 text-xs text-muted-foreground">
                Signed in as {user?.email}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="About this workspace" description="Environment details for troubleshooting." />
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">App</span>
                <span className="font-medium text-foreground">{APP_NAME}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Environment</span>
                <Badge variant={IS_PRODUCTION ? "primary" : "warning"}>
                  {IS_PRODUCTION ? "Production" : "Development"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium text-foreground">Student</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
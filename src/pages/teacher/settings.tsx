import { APP_NAME, IS_PRODUCTION } from "@/lib/config";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { SecurityCard } from "@/components/settings/security-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TeacherSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Your account and app details." />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm />
        <div className="space-y-6">
          <SecurityCard />
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
              <span className="font-medium text-foreground">Teacher</span>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
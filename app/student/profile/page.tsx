"use client";

import * as React from "react";
import { UserRound, Mail, Phone, School, BookOpen, BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";

interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  studentNo: string;
  groupId: string | null;
  groupName: string | null;
  groupColor: string | null;
  phone: string | null;
  parentPhone: string | null;
  school: string | null;
  stream: string | null;
  active: boolean;
  registeredAt: string;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    api
      .get<Profile>("/api/student/profile")
      .then(setProfile)
      .catch(() => setError(true));
  }, []);

  if (error) return <EmptyState icon={UserRound} title="Could not load your profile." />;
  if (!profile) return <Spinner className="py-24" />;

  const rows = [
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Phone, label: "Phone", value: profile.phone },
    { icon: Phone, label: "Parent phone", value: profile.parentPhone },
    { icon: School, label: "School", value: profile.school },
    { icon: BookOpen, label: "Stream", value: profile.stream },
  ].filter((r) => r.value);

  return (
    <>
      <PageHeader title="My Profile" description="Your information." />

      <Card>
        <CardContent className="flex flex-col items-center py-6 text-center">
          <Avatar name={profile.fullName} src={profile.avatarUrl} size="xl" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">{profile.fullName}</h2>
          <p className="text-sm text-muted-foreground">{profile.studentNo}</p>
          {profile.groupName ? (
            <Badge tone="primary" className="mt-2">
              <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: profile.groupColor ?? "#7c3aed" }} />
              {profile.groupName}
            </Badge>
          ) : (
            <Badge tone="warning" className="mt-2">No group</Badge>
          )}
          <Badge tone="success" className="mt-2">
            <BadgeCheck className="h-3 w-3" aria-hidden /> Account linked
          </Badge>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" aria-hidden /> Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No additional details on file.</p>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {rows.map((r, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <r.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="w-32 shrink-0 text-sm text-muted-foreground">{r.label}</span>
                  <span className="text-sm font-medium text-foreground">{r.value}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
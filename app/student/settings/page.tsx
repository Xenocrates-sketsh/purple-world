"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Palette, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { STREAMS } from "@/lib/constants";

interface Profile {
  fullName: string;
  email: string;
  phone: string | null;
  parentPhone: string | null;
  school: string | null;
  stream: string | null;
}

export default function StudentSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ fullName: "", phone: "", parentPhone: "", school: "", stream: "" });

  React.useEffect(() => {
    api
      .get<Profile>("/api/student/profile")
      .then((p) => {
        setProfile(p);
        setForm({
          fullName: p.fullName,
          phone: p.phone ?? "",
          parentPhone: p.parentPhone ?? "",
          school: p.school ?? "",
          stream: p.stream ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/api/student/settings", form);
      toast({ kind: "success", title: "Profile updated" });
      router.refresh();
    } catch (e) {
      toast({ kind: "error", title: e instanceof Error ? e.message : "Could not save changes." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner className="py-24" />;
  if (!profile)
    return <EmptyState icon={UserRound} title="Could not load your profile." />;

  return (
    <>
      <PageHeader title="Settings" description="Update your details." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" aria-hidden /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="parentPhone">Parent phone</Label>
                <Input id="parentPhone" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="school">School</Label>
                <Input id="school" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="stream">Stream</Label>
                <Select id="stream" value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} options={[{ value: "", label: "Not set" }, ...STREAMS.map((s) => ({ value: s, label: s }))]} />
              </div>
            </div>
            <Button onClick={save} loading={saving}>
              <Save className="h-4 w-4" aria-hidden /> Save changes
            </Button>
            <p className="text-xs text-muted-foreground">
              Sign-in email: {profile.email}. You cannot change it here.
            </p>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" aria-hidden /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl bg-surface-muted/60 p-3">
              <span className="text-sm text-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
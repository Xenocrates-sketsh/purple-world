"use client";

import * as React from "react";
import { Mail, ShieldCheck, Palette } from "lucide-react";
import { PageHeader } from "@/components/layout/portal-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth-context";

export default function TeacherSettingsPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="Settings" description="Your account and preferences." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" aria-hidden /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-surface-muted/60 p-3">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-muted/60 p-3">
              <span className="text-muted-foreground">Role</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden /> Teacher
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Sign in to the Netlify Identity dashboard to change your password.
            </p>
          </CardContent>
        </Card>

        <Card>
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
            <p className="mt-2 text-xs text-muted-foreground">
              Choose between light and dark mode. Your choice is saved on this device.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
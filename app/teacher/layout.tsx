"use client";

import { PortalShell } from "@/components/layout/portal-shell";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell role="teacher">{children}</PortalShell>;
}

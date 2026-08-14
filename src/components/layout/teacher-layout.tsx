import { Outlet } from "react-router-dom";

import { PortalShell } from "./portal-shell";
import { teacherPrimaryNav, teacherSecondaryNav } from "./nav-config";

export function TeacherLayout() {
  return (
    <PortalShell
      pageTitle="Teacher"
      primaryNav={teacherPrimaryNav}
      secondaryNav={teacherSecondaryNav}
    >
      <Outlet />
    </PortalShell>
  );
}
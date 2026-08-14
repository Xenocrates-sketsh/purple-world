import { Outlet } from "react-router-dom";

import { PortalShell } from "./portal-shell";
import { studentPrimaryNav, studentSecondaryNav } from "./nav-config";

export function StudentLayout() {
  return (
    <PortalShell
      pageTitle="Student"
      primaryNav={studentPrimaryNav}
      secondaryNav={studentSecondaryNav}
    >
      <Outlet />
    </PortalShell>
  );
}
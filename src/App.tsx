import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Ban } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import type { Role } from "@/lib/types";
import { FullPageSpinner } from "@/components/ui/spinner";
import { ConfigWarning } from "@/components/config-warning";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

import { WelcomePage } from "@/pages/welcome";
import { LoginPage } from "@/pages/login";
import { TeacherLoginPage } from "@/pages/teacher-login";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import { DesignGalleryPage } from "@/pages/design";

const MissHafsaPage = lazy(() =>
  import("@/pages/miss-hafsa").then((m) => ({ default: m.MissHafsaPage }))
);

import { TeacherLayout } from "@/components/layout/teacher-layout";
import { StudentLayout } from "@/components/layout/student-layout";

// Route pages are code-split so the first load stays small.
const TeacherDashboardPage = lazy(() =>
  import("@/pages/teacher/dashboard").then((m) => ({ default: m.TeacherDashboardPage }))
);
const TeacherStudentsPage = lazy(() =>
  import("@/pages/teacher/students").then((m) => ({ default: m.TeacherStudentsPage }))
);
const TeacherArrivalsPage = lazy(() =>
  import("@/pages/teacher/arrivals").then((m) => ({ default: m.TeacherArrivalsPage }))
);
const TeacherStudentDetailPage = lazy(() =>
  import("@/pages/teacher/student-detail").then((m) => ({ default: m.TeacherStudentDetailPage }))
);
const TeacherGroupsPage = lazy(() =>
  import("@/pages/teacher/groups").then((m) => ({ default: m.TeacherGroupsPage }))
);
const TeacherGroupDetailPage = lazy(() =>
  import("@/pages/teacher/group-detail").then((m) => ({ default: m.TeacherGroupDetailPage }))
);
const TeacherSchedulePage = lazy(() =>
  import("@/pages/teacher/schedule").then((m) => ({ default: m.TeacherSchedulePage }))
);
const TeacherAttendancePage = lazy(() =>
  import("@/pages/teacher/attendance").then((m) => ({ default: m.TeacherAttendancePage }))
);
const TeacherGradesPage = lazy(() =>
  import("@/pages/teacher/grades").then((m) => ({ default: m.TeacherGradesPage }))
);
const TeacherGradeDetailPage = lazy(() =>
  import("@/pages/teacher/grade-detail").then((m) => ({ default: m.TeacherGradeDetailPage }))
);
const TeacherExercisesPage = lazy(() =>
  import("@/pages/teacher/exercises").then((m) => ({ default: m.TeacherExercisesPage }))
);
const TeacherExerciseDetailPage = lazy(() =>
  import("@/pages/teacher/exercise-detail").then((m) => ({ default: m.TeacherExerciseDetailPage }))
);
const TeacherAnnouncementsPage = lazy(() =>
  import("@/pages/teacher/announcements").then((m) => ({ default: m.TeacherAnnouncementsPage }))
);
const TeacherLessonsPage = lazy(() =>
  import("@/pages/teacher/lessons").then((m) => ({ default: m.TeacherLessonsPage }))
);
const TeacherChatPage = lazy(() =>
  import("@/pages/teacher/chat").then((m) => ({ default: m.TeacherChatPage }))
);
const TeacherSettingsPage = lazy(() =>
  import("@/pages/teacher/settings").then((m) => ({ default: m.TeacherSettingsPage }))
);

const StudentDashboardPage = lazy(() =>
  import("@/pages/student/dashboard").then((m) => ({ default: m.StudentDashboardPage }))
);
const StudentProfilePage = lazy(() =>
  import("@/pages/student/profile").then((m) => ({ default: m.StudentProfilePage }))
);
const StudentGradesPage = lazy(() =>
  import("@/pages/student/grades").then((m) => ({ default: m.StudentGradesPage }))
);
const StudentGroupPage = lazy(() =>
  import("@/pages/student/group").then((m) => ({ default: m.StudentGroupPage }))
);
const StudentExercisesPage = lazy(() =>
  import("@/pages/student/exercises").then((m) => ({ default: m.StudentExercisesPage }))
);
const StudentAnnouncementsPage = lazy(() =>
  import("@/pages/student/announcements").then((m) => ({ default: m.StudentAnnouncementsPage }))
);
const StudentLessonsPage = lazy(() =>
  import("@/pages/student/lessons").then((m) => ({ default: m.StudentLessonsPage }))
);
const StudentChatPage = lazy(() =>
  import("@/pages/student/chat").then((m) => ({ default: m.StudentChatPage }))
);
const StudentSettingsPage = lazy(() =>
  import("@/pages/student/settings").then((m) => ({ default: m.StudentSettingsPage }))
);

/** Gate that waits for auth state, then renders <Outlet/> only for the role. */
function RouteGate({ role }: { role?: Role }) {
  const { status, user, userDoc, role: userRole } = useAuth();
  const location = useLocation();

  if (status === "unconfigured") return <ConfigWarning />;
  if (
    status === "loading" ||
    (user && status === "ready" && userRole === null) ||
    // A student's profile doc also carries the teacher-set "blocked" flag;
    // wait for it so a blocked student never sees even a flash of the app.
    (user && status === "ready" && userRole === "student" && userDoc == null)
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6">
        <FullPageSpinner label="Preparing your space…" />
        <p className="text-xs text-muted-foreground">
          status: {status} · signed-in: {user ? "yes" : "no"} · role:{" "}
          {userRole ?? "null"} · profile doc: {userDoc ? "loaded" : "missing"}
        </p>
        {status === "ready" && user && userRole === null ? (
          <p className="max-w-sm text-center text-xs text-danger">
            Stuck waiting for a role. If this persists, sign out and back in, or
            ask your teacher to confirm your account is set up.
          </p>
        ) : null}
      </div>
    );
  }
  if (!user) {
    const teacherRoute = location.pathname.startsWith("/teacher");
    const to = teacherRoute
      ? { pathname: "/login/teacher", state: { from: location } }
      : { pathname: "/login", state: { from: location } };
    return <Navigate to={to} replace />;
  }
  if (role === "student" && userDoc?.blocked) {
    return <BlockedScreen />;
  }
  if (role && userRole !== role) {
    return <Navigate to={userRole === "teacher" ? "/teacher" : "/student"} replace />;
  }
  return <Outlet />;
}

/** Full-screen lockout shown when the teacher has blocked the account. */
function BlockedScreen() {
  async function handleSignOut() {
    const { signOut } = await import("firebase/auth");
    await signOut(getFirebaseAuth());
    window.location.assign("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <Brand />
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <Ban className="h-8 w-8" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Your account has been blocked</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          You can no longer access this app or send messages. If you believe this is a mistake,
          contact your teacher.
        </p>
      </div>
      <Button onClick={handleSignOut}>Sign out</Button>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/teacher" element={<TeacherLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/design" element={<DesignGalleryPage />} />
          <Route path="/miss-hafsa" element={<MissHafsaPage />} />

          <Route element={<RouteGate role="teacher" />}>
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<TeacherDashboardPage />} />
              <Route path="arrivals" element={<TeacherArrivalsPage />} />
              <Route path="students" element={<TeacherStudentsPage />} />
              <Route path="students/:studentId" element={<TeacherStudentDetailPage />} />
              <Route path="groups" element={<TeacherGroupsPage />} />
              <Route path="groups/:groupId" element={<TeacherGroupDetailPage />} />
              <Route path="schedule" element={<TeacherSchedulePage />} />
              <Route path="schedule/attendance/:lessonId" element={<TeacherAttendancePage />} />
              <Route path="grades" element={<TeacherGradesPage />} />
              <Route path="grades/:assessmentId" element={<TeacherGradeDetailPage />} />
              <Route path="exercises" element={<TeacherExercisesPage />} />
              <Route path="exercises/:exerciseId" element={<TeacherExerciseDetailPage />} />
              <Route path="announcements" element={<TeacherAnnouncementsPage />} />
              <Route path="lessons" element={<TeacherLessonsPage />} />
              <Route path="chat" element={<TeacherChatPage />} />
              <Route path="settings" element={<TeacherSettingsPage />} />
            </Route>
          </Route>

          <Route element={<RouteGate role="student" />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboardPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
              <Route path="grades" element={<StudentGradesPage />} />
              <Route path="group" element={<StudentGroupPage />} />
              <Route path="exercises" element={<StudentExercisesPage />} />
              <Route path="announcements" element={<StudentAnnouncementsPage />} />
              <Route path="lessons" element={<StudentLessonsPage />} />
              <Route path="chat" element={<StudentChatPage />} />
              <Route path="settings" element={<StudentSettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

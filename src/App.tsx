import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Ban } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import type { Role } from "@/lib/types";
import { FullPageSpinner } from "@/components/ui/spinner";
import { ConfigWarning } from "@/components/config-warning";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

import { WelcomePage } from "@/pages/welcome";import { LoginPage } from "@/pages/login";
import { TeacherLoginPage } from "@/pages/teacher-login";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import { DesignGalleryPage } from "@/pages/design";

import { TeacherLayout } from "@/components/layout/teacher-layout";
import { StudentLayout } from "@/components/layout/student-layout";

// ---- Teacher pages ----
import { TeacherDashboardPage } from "@/pages/teacher/dashboard";
import { TeacherStudentsPage } from "@/pages/teacher/students";
import { TeacherArrivalsPage } from "@/pages/teacher/arrivals";
import { TeacherStudentDetailPage } from "@/pages/teacher/student-detail";
import { TeacherGroupsPage } from "@/pages/teacher/groups";
import { TeacherGroupDetailPage } from "@/pages/teacher/group-detail";
import { TeacherSchedulePage } from "@/pages/teacher/schedule";
import { TeacherAttendancePage } from "@/pages/teacher/attendance";
import { TeacherGradesPage } from "@/pages/teacher/grades";
import { TeacherGradeDetailPage } from "@/pages/teacher/grade-detail";
import { TeacherExercisesPage } from "@/pages/teacher/exercises";
import { TeacherExerciseDetailPage } from "@/pages/teacher/exercise-detail";
import { TeacherAnnouncementsPage } from "@/pages/teacher/announcements";
import { TeacherLessonsPage } from "@/pages/teacher/lessons";
import { TeacherPaymentsPage } from "@/pages/teacher/payments";
import { TeacherChatPage } from "@/pages/teacher/chat";
import { TeacherChatThreadPage } from "@/pages/teacher/chat-thread";
import { TeacherGroupChatPage } from "@/pages/teacher/group-chat";
import { TeacherSettingsPage } from "@/pages/teacher/settings";

// ---- Student pages ----
import { StudentDashboardPage } from "@/pages/student/dashboard";
import { StudentProfilePage } from "@/pages/student/profile";
import { StudentGradesPage } from "@/pages/student/grades";
import { StudentGroupPage } from "@/pages/student/group";
import { StudentPaymentsPage } from "@/pages/student/payments";
import { StudentExercisesPage } from "@/pages/student/exercises";
import { StudentAnnouncementsPage } from "@/pages/student/announcements";
import { StudentLessonsPage } from "@/pages/student/lessons";
import { StudentChatPage } from "@/pages/student/chat";
import { StudentChatThreadPage } from "@/pages/student/chat-thread";
import { StudentSettingsPage } from "@/pages/student/settings";

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
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/teacher" element={<TeacherLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/design" element={<DesignGalleryPage />} />

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
            <Route path="payments" element={<TeacherPaymentsPage />} />
            <Route path="chat" element={<TeacherChatPage />} />
            <Route path="chat/:studentId" element={<TeacherChatThreadPage />} />
            <Route path="chat/group/:conversationId" element={<TeacherGroupChatPage />} />
            <Route path="settings" element={<TeacherSettingsPage />} />
          </Route>
        </Route>

        <Route element={<RouteGate role="student" />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboardPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="grades" element={<StudentGradesPage />} />
            <Route path="group" element={<StudentGroupPage />} />
            <Route path="payments" element={<StudentPaymentsPage />} />
            <Route path="exercises" element={<StudentExercisesPage />} />
            <Route path="announcements" element={<StudentAnnouncementsPage />} />
            <Route path="lessons" element={<StudentLessonsPage />} />
            <Route path="chat" element={<StudentChatPage />} />
            <Route path="chat/:conversationId" element={<StudentChatThreadPage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { FullPageSpinner } from "@/components/ui/spinner";
import { ConfigWarning } from "@/components/config-warning";
import { getFirebaseAuth, getFirestoreDb, initFirebase } from "@/lib/firebase";

import { WelcomePage } from "@/pages/welcome";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { ForgotPasswordPage } from "@/pages/forgot-password";

import { TeacherLayout } from "@/components/layout/teacher-layout";
import { StudentLayout } from "@/components/layout/student-layout";

// ---- Teacher pages ----
import { TeacherDashboardPage } from "@/pages/teacher/dashboard";
import { TeacherStudentsPage } from "@/pages/teacher/students";
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
import { TeacherProgramPage } from "@/pages/teacher/program";
import { TeacherPaymentsPage } from "@/pages/teacher/payments";
import { TeacherChatPage } from "@/pages/teacher/chat";
import { TeacherChatThreadPage } from "@/pages/teacher/chat-thread";
import { TeacherSettingsPage } from "@/pages/teacher/settings";

// ---- Student pages ----
import { StudentDashboardPage } from "@/pages/student/dashboard";
import { StudentProfilePage } from "@/pages/student/profile";
import { StudentGradesPage } from "@/pages/student/grades";
import { StudentGroupPage } from "@/pages/student/group";
import { StudentPaymentsPage } from "@/pages/student/payments";
import { StudentExercisesPage } from "@/pages/student/exercises";
import { StudentAnnouncementsPage } from "@/pages/student/announcements";
import { StudentProgramPage } from "@/pages/student/program";
import { StudentChatPage } from "@/pages/student/chat";
import { StudentSettingsPage } from "@/pages/student/settings";

/** Gate that waits for auth state, then renders <Outlet/> only for the role. */
function RouteGate({ role }: { role?: Role }) {
  const { status, user, role: userRole } = useAuth();
  const location = useLocation();

  if (status === "unconfigured") return <ConfigWarning />;
  if (status === "loading" || (user && status === "ready" && userRole === null)) {
    return <FullPageSpinner label="Preparing your space…" />;
  }
  if (!user) {
    const to = location.pathname.startsWith("/teacher") || location.pathname.startsWith("/student")
      ? { pathname: "/login", state: { from: location } }
      : "/login";
    return <Navigate to={to} replace />;
  }
  if (role && userRole !== role) {
    return <Navigate to={userRole === "teacher" ? "/teacher" : "/student"} replace />;
  }
  return <Outlet />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RouteGate role="teacher" />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboardPage />} />
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
            <Route path="program" element={<TeacherProgramPage />} />
            <Route path="payments" element={<TeacherPaymentsPage />} />
            <Route path="chat" element={<TeacherChatPage />} />
            <Route path="chat/:studentId" element={<TeacherChatThreadPage />} />
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
            <Route path="program" element={<StudentProgramPage />} />
            <Route path="chat" element={<StudentChatPage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
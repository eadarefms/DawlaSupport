import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RegisterTeacher from "./pages/RegisterTeacher";
import RegisterStudent from "./pages/RegisterStudent";
import DashboardShell from "./pages/DashboardShell";
import Home from "./pages/Home";
import ProposeSession from "./pages/ProposeSession";
import WeeklySchedule from "./pages/WeeklySchedule";
import AvailableLessons from "./pages/AvailableLessons";
import MyLessons from "./pages/MyLessons";
import StudentsList from "./pages/StudentsList";
import TeachersDirectory from "./pages/TeachersDirectory";
import StudentsDirectory from "./pages/StudentsDirectory";
import SessionsManagement from "./pages/SessionsManagement";
import HoursAndCertificates from "./pages/HoursAndCertificates";
import EligibleTeachersList from "./pages/EligibleTeachersList";
import Notifications from "./pages/Notifications";
import StatsPage from "./pages/StatsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import UserManagement from "./pages/UserManagement";
import { useAuth } from "./context/AuthContext";

function HoursRoute() {
  const { user } = useAuth();
  return user?.role === "TEACHER" ? <HoursAndCertificates /> : <EligibleTeachersList />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register/teacher" element={<RegisterTeacher />} />
          <Route path="/register/student" element={<RegisterStudent />} />

          <Route path="/" element={<DashboardShell />}>
            <Route index element={<Home />} />
            <Route path="propose-session" element={<ProposeSession />} />
            <Route path="schedule" element={<WeeklySchedule />} />
            <Route path="available-lessons" element={<AvailableLessons />} />
            <Route path="my-lessons" element={<MyLessons />} />
            <Route path="beneficiaries" element={<StudentsList />} />
            <Route path="teachers" element={<TeachersDirectory />} />
            <Route path="students" element={<StudentsDirectory />} />
            <Route path="sessions" element={<SessionsManagement />} />
            <Route path="hours-certificates" element={<HoursRoute />} />
            <Route path="hours" element={<Navigate to="/hours-certificates" replace />} />
            <Route path="certificates" element={<Navigate to="/hours-certificates" replace />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

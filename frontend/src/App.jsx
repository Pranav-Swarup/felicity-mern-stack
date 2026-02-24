import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Layout/Navbar";
import ProtectedRoute from "./components/Layout/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Onboarding from "./pages/auth/Onboarding";

import ParticipantDashboard from "./pages/participant/Dashboard";

import OrganizerDashboard from "./pages/organizer/Dashboard";
import CreateEvent from "./pages/organizer/CreateEvent";
import OrganizerEventDetail from "./pages/organizer/EventDetail";
import OrganizerProfile from "./pages/organizer/Profile";
import OngoingEvents from "./pages/organizer/OngoingEvents";

import AdminDashboard from "./pages/admin/Dashboard";
import ManageOrganizers from "./pages/admin/ManageOrganizers";
import PasswordResets from "./pages/admin/PasswordResets";

function RootRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  const paths = { participant: "/dashboard", organizer: "/organizer/dashboard", admin: "/admin/dashboard" };
  return <Navigate to={paths[role] || "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  const hideNav = ["/login", "/register", "/onboarding"].includes(pathname);

  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<PR roles={["participant"]}><Onboarding /></PR>} />

        {/* participant */}
        <Route path="/dashboard" element={<PR roles={["participant"]}><ParticipantDashboard /></PR>} />

        {/* organizer */}
        <Route path="/organizer/dashboard" element={<PR roles={["organizer"]}><OrganizerDashboard /></PR>} />
        <Route path="/organizer/events/create" element={<PR roles={["organizer"]}><CreateEvent /></PR>} />
        <Route path="/organizer/events/:id" element={<PR roles={["organizer"]}><OrganizerEventDetail /></PR>} />
        <Route path="/organizer/profile" element={<PR roles={["organizer"]}><OrganizerProfile /></PR>} />
        <Route path="/organizer/ongoing" element={<PR roles={["organizer"]}><OngoingEvents /></PR>} />

        {/* admin */}
        <Route path="/admin/dashboard" element={<PR roles={["admin"]}><AdminDashboard /></PR>} />
        <Route path="/admin/organizers" element={<PR roles={["admin"]}><ManageOrganizers /></PR>} />
        <Route path="/admin/password-resets" element={<PR roles={["admin"]}><PasswordResets /></PR>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// shorthand wrapper to keep routes readable
function PR({ roles, children }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>;
}

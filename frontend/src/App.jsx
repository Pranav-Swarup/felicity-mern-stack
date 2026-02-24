import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Layout/Navbar";
import ProtectedRoute from "./components/Layout/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Onboarding from "./pages/auth/Onboarding";

import ParticipantDashboard from "./pages/participant/Dashboard";
import BrowseEvents from "./pages/participant/BrowseEvents";
import EventDetail from "./pages/participant/EventDetail";
import ParticipantProfile from "./pages/participant/Profile";
import ClubsList from "./pages/participant/ClubsList";
import OrganizerDetail from "./pages/participant/OrganizerDetail";

import OrganizerDashboard from "./pages/organizer/Dashboard";
import CreateEvent from "./pages/organizer/CreateEvent";
import EditEvent from "./pages/organizer/EditEvent";
import OrganizerEventDetail from "./pages/organizer/EventDetail";
import OrganizerProfile from "./pages/organizer/Profile";
import OngoingEvents from "./pages/organizer/OngoingEvents";

import AdminDashboard from "./pages/admin/Dashboard";
import ManageOrganizers from "./pages/admin/ManageOrganizers";
import PasswordResets from "./pages/admin/PasswordResets";

function RootRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
  if (!user) return <Navigate to="/login" replace />;
  const p = { participant: "/dashboard", organizer: "/organizer/dashboard", admin: "/admin/dashboard" };
  return <Navigate to={p[role] || "/login"} replace />;
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
        <Route path="/onboarding" element={<PR r={["participant"]}><Onboarding /></PR>} />

        {/* participant */}
        <Route path="/dashboard" element={<PR r={["participant"]}><ParticipantDashboard /></PR>} />
        <Route path="/events" element={<PR r={["participant"]}><BrowseEvents /></PR>} />
        <Route path="/events/:id" element={<PR r={["participant"]}><EventDetail /></PR>} />
        <Route path="/profile" element={<PR r={["participant"]}><ParticipantProfile /></PR>} />
        <Route path="/clubs" element={<PR r={["participant"]}><ClubsList /></PR>} />
        <Route path="/clubs/:id" element={<PR r={["participant"]}><OrganizerDetail /></PR>} />

        {/* organizer */}
        <Route path="/organizer/dashboard" element={<PR r={["organizer"]}><OrganizerDashboard /></PR>} />
        <Route path="/organizer/events/create" element={<PR r={["organizer"]}><CreateEvent /></PR>} />
        <Route path="/organizer/events/:id/edit" element={<PR r={["organizer"]}><EditEvent /></PR>} />
        <Route path="/organizer/events/:id" element={<PR r={["organizer"]}><OrganizerEventDetail /></PR>} />
        <Route path="/organizer/profile" element={<PR r={["organizer"]}><OrganizerProfile /></PR>} />
        <Route path="/organizer/ongoing" element={<PR r={["organizer"]}><OngoingEvents /></PR>} />

        {/* admin */}
        <Route path="/admin/dashboard" element={<PR r={["admin"]}><AdminDashboard /></PR>} />
        <Route path="/admin/organizers" element={<PR r={["admin"]}><ManageOrganizers /></PR>} />
        <Route path="/admin/password-resets" element={<PR r={["admin"]}><PasswordResets /></PR>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function PR({ r, children }) {
  return <ProtectedRoute allowedRoles={r}>{children}</ProtectedRoute>;
}

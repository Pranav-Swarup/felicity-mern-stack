import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
      <p className="text-sm opacity-60 mb-6">Signed in as {user?.email}</p>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Organizers" value={stats.totalOrganizers} />
          <StatCard label="Active" value={stats.activeOrganizers} color="text-success" />
          <StatCard label="Disabled" value={stats.disabledOrganizers} color="text-warning" />
          <StatCard label="Participants" value={stats.totalParticipants} />
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner"></span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/organizers" className="card bg-base-200 hover:bg-base-300 transition cursor-pointer">
          <div className="card-body">
            <h2 className="card-title text-lg">Manage Clubs / Organizers</h2>
            <p className="text-sm opacity-60">Create, disable, archive, or remove organizer accounts.</p>
          </div>
        </Link>
        <Link to="/admin/password-resets" className="card bg-base-200 hover:bg-base-300 transition cursor-pointer">
          <div className="card-body">
            <h2 className="card-title text-lg">Password Reset Requests</h2>
            <p className="text-sm opacity-60">Review and handle organizer password reset requests.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "" }) {
  return (
    <div className="card bg-base-200">
      <div className="card-body py-4 items-center text-center">
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-xs opacity-60">{label}</p>
      </div>
    </div>
  );
}

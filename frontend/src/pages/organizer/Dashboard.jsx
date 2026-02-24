import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";

const statusColors = {
  draft: "badge-ghost",
  published: "badge-info",
  ongoing: "badge-success",
  completed: "badge-neutral",
  closed: "badge-warning",
};

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/organizer/dashboard")
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const events = data?.events || [];
  const analytics = data?.analytics || {};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{user?.organizerName}</h1>
          <p className="text-sm opacity-60">{user?.category} • {user?.email}</p>
        </div>
        <Link to="/organizer/events/create" className="btn btn-primary btn-sm">
          + Create Event
        </Link>
      </div>

      {/* analytics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card bg-base-200">
          <div className="card-body py-4 items-center text-center">
            <p className="text-3xl font-bold">{analytics.completedEvents || 0}</p>
            <p className="text-xs opacity-60">Completed Events</p>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body py-4 items-center text-center">
            <p className="text-3xl font-bold">{analytics.totalRegistrations || 0}</p>
            <p className="text-xs opacity-60">Total Registrations</p>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body py-4 items-center text-center">
            <p className="text-3xl font-bold">₹{analytics.totalRevenue || 0}</p>
            <p className="text-xs opacity-60">Revenue</p>
          </div>
        </div>
      </div>

      {/* events carousel / grid */}
      <h2 className="text-lg font-semibold mb-3">Your Events</h2>
      {events.length === 0 ? (
        <p className="opacity-50">No events yet. Create your first one!</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {events.map((ev) => (
            <Link
              key={ev._id}
              to={`/organizer/events/${ev._id}`}
              className="card bg-base-200 min-w-[260px] max-w-[280px] flex-shrink-0 hover:bg-base-300 transition"
            >
              <div className="card-body py-4 px-5">
                <h3 className="font-semibold text-sm line-clamp-1">{ev.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge badge-sm ${statusColors[ev.status] || ""}`}>{ev.status}</span>
                  <span className="text-xs opacity-50">{ev.type}</span>
                </div>
                <p className="text-xs opacity-50 mt-1">
                  {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : "No date set"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

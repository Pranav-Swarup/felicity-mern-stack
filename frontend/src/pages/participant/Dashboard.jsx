import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import TicketModal from "../../components/TicketModal";

const historyTabs = ["All", "Normal", "Merchandise", "Completed", "Cancelled"];

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [ticketId, setTicketId] = useState(null);

  useEffect(() => {
    api.get("/registrations/my")
      .then(({ data }) => setRegistrations(data.registrations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = registrations.filter(
    (r) => r.eventId &&
      new Date(r.eventId.endDate) >= now &&
      r.status === "confirmed" &&
      r.eventId.status !== "completed" &&
      r.eventId.status !== "closed"
  );

  const filtered = registrations.filter((r) => {
    if (!r.eventId) return false;
    if (activeTab === "All") return true;
    if (activeTab === "Normal") return r.eventId.type === "normal";
    if (activeTab === "Merchandise") return r.eventId.type === "merchandise";
    if (activeTab === "Completed") return r.eventId.status === "completed" || r.eventId.status === "closed";
    if (activeTab === "Cancelled") return r.status === "cancelled" || r.status === "rejected";
    return true;
  });

  if (loading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">My Dashboard</h1>
      <p className="text-sm opacity-60 mb-6">Welcome back, {user?.firstName}!</p>

      {/* upcoming */}
      <h2 className="text-lg font-semibold mb-3">Upcoming Events</h2>
      {upcoming.length === 0 ? (
        <div className="card bg-base-200 mb-6">
          <div className="card-body py-6 text-center">
            <p className="opacity-50 text-sm">No upcoming events.</p>
            <Link to="/events" className="link link-primary text-sm mt-1">Browse events</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {upcoming.map((r) => (
            <div key={r._id} className="card bg-base-200">
              <div className="card-body py-4 px-5">
                <h3 className="font-semibold text-sm">{r.eventId.name}</h3>
                <p className="text-xs opacity-50">
                  {r.eventId.organizerId?.organizerName} • {r.eventId.type}
                </p>
                <p className="text-xs opacity-50">
                  {new Date(r.eventId.startDate).toLocaleDateString()}
                </p>
                <button
                  className="btn btn-xs btn-outline mt-2 w-fit"
                  onClick={() => setTicketId(r.ticketId)}
                >
                  Ticket: {r.ticketId}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* history */}
      <h2 className="text-lg font-semibold mb-3">Participation History</h2>
      <div role="tablist" className="tabs tabs-boxed mb-4 bg-base-200 w-fit">
        {historyTabs.map((t) => (
          <button
            key={t}
            role="tab"
            className={`tab tab-sm ${activeTab === t ? "tab-active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="opacity-50 text-sm py-4">Nothing here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Organizer</th>
                <th>Status</th>
                <th>Ticket</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td className="font-medium">{r.eventId?.name}</td>
                  <td className="text-sm">{r.eventId?.type}</td>
                  <td className="text-sm opacity-70">{r.eventId?.organizerId?.organizerName}</td>
                  <td><span className="badge badge-sm badge-ghost">{r.status}</span></td>
                  <td>
                    <button
                      className="link link-primary text-xs font-mono"
                      onClick={() => setTicketId(r.ticketId)}
                    >
                      {r.ticketId}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ticketId && <TicketModal ticketId={ticketId} onClose={() => setTicketId(null)} />}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/client";

export default function OrganizerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    api.get(`/organizers/${id}`)
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;
  }
  if (!data) return <p className="p-6 opacity-50">Organizer not found.</p>;

  const { organizer, upcoming, past } = data;
  const events = tab === "upcoming" ? upcoming : past;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{organizer.organizerName}</h1>
      <span className="badge badge-ghost">{organizer.category}</span>
      <p className="text-sm opacity-60 mt-2">{organizer.description || "No description."}</p>
      {organizer.contactEmail && (
        <p className="text-sm opacity-50 mt-1">Contact: {organizer.contactEmail}</p>
      )}

      <div role="tablist" className="tabs tabs-bordered mt-6 mb-4">
        <button role="tab" className={`tab ${tab === "upcoming" ? "tab-active" : ""}`} onClick={() => setTab("upcoming")}>
          Upcoming ({upcoming?.length || 0})
        </button>
        <button role="tab" className={`tab ${tab === "past" ? "tab-active" : ""}`} onClick={() => setTab("past")}>
          Past ({past?.length || 0})
        </button>
      </div>

      {events.length === 0 ? (
        <p className="opacity-50 text-sm py-4">No events.</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <Link key={ev._id} to={`/events/${ev._id}`} className="card bg-base-200 hover:bg-base-300 transition">
              <div className="card-body py-3 px-5 flex-row items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{ev.name}</h3>
                  <p className="text-xs opacity-50">
                    {ev.type} • {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : "TBD"}
                  </p>
                </div>
                <span className="badge badge-sm badge-ghost">{ev.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

export default function OngoingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/organizer/dashboard")
      .then(({ data }) => {
        setEvents(data.events.filter((e) => e.status === "ongoing"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ongoing Events</h1>
      {events.length === 0 ? (
        <p className="opacity-50">No ongoing events right now.</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <Link
              key={ev._id}
              to={`/organizer/events/${ev._id}`}
              className="card bg-base-200 hover:bg-base-300 transition"
            >
              <div className="card-body py-4 flex-row items-center justify-between">
                <div>
                  <h3 className="font-semibold">{ev.name}</h3>
                  <p className="text-sm opacity-50">
                    {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : ""} — {ev.type}
                  </p>
                </div>
                <span className="badge badge-success">ongoing</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

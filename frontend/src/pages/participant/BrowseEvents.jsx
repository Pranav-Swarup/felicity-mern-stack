import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

export default function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    eligibility: "",
    dateFrom: "",
    dateTo: "",
    followedOnly: false,
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (filters.type) params.set("type", filters.type);
      if (filters.eligibility) params.set("eligibility", filters.eligibility);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.followedOnly) params.set("followedOnly", "true");

      const { data } = await api.get(`/events?${params.toString()}`);
      setEvents(data.events || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  const fetchTrending = async () => {
    try {
      const { data } = await api.get("/events?trending=true");
      setTrending(data.events || []);
    } catch {}
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchEvents, 300);
    return () => clearTimeout(t);
  }, [fetchEvents]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Browse Events</h1>

      {/* trending */}
      {trending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold opacity-60 mb-2">🔥 Trending</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {trending.map((ev) => (
              <Link
                key={ev._id}
                to={`/events/${ev._id}`}
                className="card bg-primary/10 min-w-[200px] flex-shrink-0 hover:bg-primary/20 transition"
              >
                <div className="card-body py-3 px-4">
                  <h3 className="font-semibold text-sm">{ev.name}</h3>
                  <p className="text-xs opacity-50">{ev.organizerId?.organizerName}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* search + filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          className="input input-bordered flex-1"
          placeholder="Search events or organizers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="normal">Normal</option>
          <option value="merchandise">Merchandise</option>
        </select>
        <select
          className="select select-bordered"
          value={filters.eligibility}
          onChange={(e) => setFilters({ ...filters, eligibility: e.target.value })}
        >
          <option value="">All Eligibility</option>
          <option value="iiit">IIIT Only</option>
          <option value="non-iiit">Non-IIIT Only</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer px-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={filters.followedOnly}
            onChange={(e) => setFilters({ ...filters, followedOnly: e.target.checked })}
          />
          <span className="text-sm whitespace-nowrap">Followed clubs</span>
        </label>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="date"
          className="input input-bordered input-sm"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
        />
        <span className="self-center text-sm opacity-50">to</span>
        <input
          type="date"
          className="input input-bordered input-sm"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
        />
        {(filters.dateFrom || filters.dateTo) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ ...filters, dateFrom: "", dateTo: "" })}
          >
            Clear dates
          </button>
        )}
      </div>

      {/* results */}
      {loading ? (
        <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg"></span></div>
      ) : events.length === 0 ? (
        <p className="text-center py-12 opacity-50">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <Link key={ev._id} to={`/events/${ev._id}`} className="card bg-base-200 hover:bg-base-300 transition">
              <div className="card-body py-4 px-5">
                <h3 className="font-semibold">{ev.name}</h3>
                <p className="text-xs opacity-60">{ev.organizerId?.organizerName} • {ev.organizerId?.category}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="badge badge-sm badge-ghost">{ev.type}</span>
                  <span className="badge badge-sm badge-ghost">{ev.eligibility}</span>
                  {ev.registrationFee > 0 && <span className="badge badge-sm badge-info">₹{ev.registrationFee}</span>}
                </div>
                <p className="text-xs opacity-50 mt-1">
                  {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : "Date TBD"}
                </p>
                {ev.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ev.tags.slice(0, 3).map((t) => (
                      <span key={t} className="badge badge-xs badge-outline">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

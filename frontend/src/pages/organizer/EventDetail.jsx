import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/client";
import toast from "react-hot-toast";

const statusColors = {
  draft: "badge-ghost",
  published: "badge-info",
  ongoing: "badge-success",
  completed: "badge-neutral",
  closed: "badge-warning",
};

const statusTransitions = {
  draft: ["published"],
  published: ["ongoing", "closed"],
  ongoing: ["completed", "closed"],
};

export default function OrganizerEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  const fetchData = async () => {
    try {
      const [evRes, partRes] = await Promise.all([
        api.get(`/organizer/events/${id}`),
        api.get(`/organizer/events/${id}/participants`),
      ]);
      setData(evRes.data);
      setParticipants(partRes.data.participants);
    } catch {
      toast.error("Failed to load event");
      navigate("/organizer/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Change status to "${newStatus}"?`)) return;
    try {
      await api.put(`/organizer/events/${id}/status`, { status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to change status");
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/organizer/events/${id}/export-csv`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `participants-${id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  const event = data?.event;
  const analytics = data?.analytics;
  if (!event) return null;

  const allowed = statusTransitions[event.status] || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${statusColors[event.status]}`}>{event.status}</span>
            <span className="text-sm opacity-50">{event.type}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {(event.status === "draft" || event.status === "published") && (
            <Link to={`/organizer/events/${id}/edit`} className="btn btn-sm btn-ghost">Edit</Link>
          )}
          {allowed.map((s) => (
            <button key={s} className="btn btn-sm btn-outline" onClick={() => handleStatusChange(s)}>
              {s === "published" ? "Publish" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* tabs */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        {["overview", "participants", ...(event.type === "merchandise" ? ["payments"] : []), "feedback"].map((t) => (
          <button
            key={t}
            role="tab"
            className={`tab ${tab === t ? "tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {/* analytics cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card bg-base-200">
              <div className="card-body py-3 items-center text-center">
                <p className="text-2xl font-bold">{analytics?.registrations || 0}</p>
                <p className="text-xs opacity-60">Registrations</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body py-3 items-center text-center">
                <p className="text-2xl font-bold">₹{analytics?.revenue || 0}</p>
                <p className="text-xs opacity-60">Revenue</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body py-3 items-center text-center">
                <p className="text-2xl font-bold">{event.registrationLimit || "∞"}</p>
                <p className="text-xs opacity-60">Limit</p>
              </div>
            </div>
          </div>

          {/* event details */}
          <div className="card bg-base-200">
            <div className="card-body text-sm space-y-1">
              <p><span className="opacity-50">Description:</span> {event.description || "—"}</p>
              <p><span className="opacity-50">Eligibility:</span> {event.eligibility}</p>
              <p><span className="opacity-50">Start:</span> {event.startDate ? new Date(event.startDate).toLocaleString() : "—"}</p>
              <p><span className="opacity-50">End:</span> {event.endDate ? new Date(event.endDate).toLocaleString() : "—"}</p>
              <p><span className="opacity-50">Deadline:</span> {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleString() : "—"}</p>
              <p><span className="opacity-50">Fee:</span> {event.registrationFee ? `₹${event.registrationFee}` : "Free"}</p>
              <p><span className="opacity-50">Tags:</span> {event.tags?.join(", ") || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "participants" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm opacity-60">{participants.length} participant(s)</p>
            <button className="btn btn-sm btn-outline" onClick={handleExportCSV}>
              Export CSV
            </button>
          </div>

          {participants.length === 0 ? (
            <p className="text-center py-8 opacity-50">No registrations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Ticket ID</th>
                    <th>Status</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.registrationId}>
                      <td>{p.participant?.firstName} {p.participant?.lastName}</td>
                      <td className="text-sm opacity-70">{p.participant?.email}</td>
                      <td className="font-mono text-xs">{p.ticketId}</td>
                      <td><span className="badge badge-sm badge-ghost">{p.status}</span></td>
                      <td className="text-xs opacity-50">{new Date(p.registeredAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "payments" && <PaymentsTab eventId={id} />}
      {tab === "feedback" && <FeedbackTab eventId={id} />}
    </div>
  );
}

function PaymentsTab({ eventId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get(`/organizer/events/${eventId}/payments`);
      setOrders(data.orders || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [eventId]);

  const handleAction = async (regId, action) => {
    try {
      await api.put(`/organizer/payments/${regId}/${action}`);
      toast.success(`Payment ${action}d`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action}`);
    }
  };

  if (loading) return <span className="loading loading-spinner"></span>;

  return (
    <div>
      <p className="text-sm opacity-60 mb-3">{orders.length} order(s)</p>
      {orders.length === 0 ? (
        <p className="opacity-50">No orders with payment tracking.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Variant</th>
                <th>Qty</th>
                <th>Proof</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{o.participantId?.firstName} {o.participantId?.lastName}</td>
                  <td className="text-sm">{o.variantId || "—"}</td>
                  <td>{o.quantity}</td>
                  <td>
                    {o.paymentProof ? (
                      <a
                        href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${o.paymentProof}`}
                        target="_blank"
                        className="link link-primary text-xs"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-xs opacity-50">Not uploaded</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-sm ${
                      o.paymentStatus === "pending" ? "badge-warning" :
                      o.paymentStatus === "approved" ? "badge-success" : "badge-error"
                    }`}>{o.paymentStatus}</span>
                  </td>
                  <td>
                    {o.paymentStatus === "pending" && (
                      <div className="flex gap-1">
                        <button className="btn btn-xs btn-success" onClick={() => handleAction(o._id, "approve")}>Approve</button>
                        <button className="btn btn-xs btn-error" onClick={() => handleAction(o._id, "reject")}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FeedbackTab({ eventId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/feedback/${eventId}`)
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <span className="loading loading-spinner"></span>;
  if (!data || data.totalRatings === 0) return <p className="opacity-50">No feedback yet.</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-4xl font-bold">{data.avgRating}</p>
          <p className="text-xs opacity-60">{data.totalRatings} rating(s)</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-4">{star}★</span>
              <progress className="progress progress-primary w-full" value={data.distribution[star]} max={data.totalRatings}></progress>
              <span className="w-6 text-right opacity-50">{data.distribution[star]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {data.feedbacks.map((f) => (
          <div key={f._id} className="card bg-base-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
              <span className="text-xs opacity-50">{new Date(f.createdAt).toLocaleDateString()}</span>
            </div>
            {f.comment && <p className="text-sm">{f.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

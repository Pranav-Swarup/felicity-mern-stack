import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import toast from "react-hot-toast";
import FormRenderer from "../../components/FormBuilder/FormRenderer";
import TicketModal from "../../components/TicketModal";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form responses for normal events
  const [formValues, setFormValues] = useState({});
  // merch selection
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  // ticket modal
  const [showTicket, setShowTicket] = useState(null);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(({ data }) => {
        setEvent(data.event);
        setIsRegistered(data.isRegistered);
        setRegistration(data.registration);
      })
      .catch(() => toast.error("Failed to load event"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    setSubmitting(true);
    try {
      // validate required custom form fields
      if (event.type === "normal" && event.customForm?.length > 0) {
        for (const f of event.customForm) {
          if (f.required && !formValues[f.fieldId]) {
            toast.error(`"${f.label}" is required`);
            setSubmitting(false);
            return;
          }
        }
      }

      const { data } = await api.post(`/registrations/events/${id}/register`, {
        formResponses: formValues,
      });
      setIsRegistered(true);
      setRegistration({ ticketId: data.ticketId, status: "confirmed" });
      toast.success("Registered! Check your email for the ticket.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedVariant) {
      toast.error("Select a variant");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/registrations/events/${id}/purchase`, {
        variantId: selectedVariant,
        quantity,
      });
      setIsRegistered(true);
      setRegistration({
        registrationId: data.registration._id,
        ticketId: data.registration.ticketId,
        status: data.registration.status,
        paymentStatus: data.registration.paymentStatus,
      });
      toast.success("Order placed! Upload payment proof to complete purchase.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Purchase failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;
  }
  if (!event) return <p className="p-6 opacity-50">Event not found.</p>;

  const deadlinePassed = event.registrationDeadline && new Date() > new Date(event.registrationDeadline);
  const limitReached = event.registrationLimit > 0 && event.registrationCount >= event.registrationLimit;
  const canRegister = !isRegistered && !deadlinePassed && !limitReached &&
    (event.status === "published" || event.status === "ongoing");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{event.name}</h1>
      <p className="text-sm opacity-60 mb-4">
        {event.organizerId?.organizerName} • {event.organizerId?.category}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge">{event.type}</span>
        <span className="badge badge-outline">{event.eligibility === "all" ? "Open to all" : event.eligibility}</span>
        <span className="badge badge-outline">{event.status}</span>
        {event.registrationFee > 0 && <span className="badge badge-info">₹{event.registrationFee}</span>}
      </div>

      <div className="card bg-base-200 mb-4">
        <div className="card-body text-sm space-y-1">
          <p>{event.description || "No description provided."}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
            <span className="opacity-50">Start</span>
            <span>{event.startDate ? new Date(event.startDate).toLocaleString() : "TBD"}</span>
            <span className="opacity-50">End</span>
            <span>{event.endDate ? new Date(event.endDate).toLocaleString() : "TBD"}</span>
            <span className="opacity-50">Deadline</span>
            <span>{event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleString() : "None"}</span>
            <span className="opacity-50">Spots</span>
            <span>{event.registrationLimit ? `${event.registrationCount}/${event.registrationLimit}` : "Unlimited"}</span>
          </div>
          {event.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.tags.map((t) => <span key={t} className="badge badge-xs badge-outline">{t}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* registration status */}
      {isRegistered && registration && registration.status === "confirmed" && (
        <div className="alert alert-success mb-4">
          <div>
            <p className="font-semibold">You're registered!</p>
            <button
              className="link font-mono text-sm"
              onClick={() => setShowTicket(registration.ticketId)}
            >
              View ticket: {registration.ticketId}
            </button>
          </div>
        </div>
      )}

      {isRegistered && registration && registration.status === "pending" && (
        <div className="alert alert-warning mb-4">
          <div>
            <p className="font-semibold">Order placed — awaiting payment approval</p>
            <p className="text-sm opacity-70">Upload your payment proof below. The organizer will review and approve it.</p>
          </div>
        </div>
      )}

      {isRegistered && registration && registration.status === "rejected" && (
        <div className="alert alert-error mb-4">
          <p className="font-semibold">Your payment was rejected. Please contact the organizer.</p>
        </div>
      )}

      {/* blocking messages */}
      {deadlinePassed && !isRegistered && (
        <div className="alert alert-warning mb-4">Registration deadline has passed.</div>
      )}
      {limitReached && !isRegistered && (
        <div className="alert alert-warning mb-4">Registration limit reached.</div>
      )}

      {/* normal event registration form */}
      {canRegister && event.type === "normal" && (
        <div className="card bg-base-200 mb-4">
          <div className="card-body">
            <h3 className="font-semibold mb-2">Register</h3>
            {event.customForm?.length > 0 && (
              <FormRenderer fields={event.customForm} values={formValues} onChange={setFormValues} />
            )}
            <button
              className={`btn btn-primary mt-4 ${submitting ? "loading" : ""}`}
              onClick={handleRegister}
              disabled={submitting}
            >
              {event.registrationFee > 0 ? `Register (₹${event.registrationFee})` : "Register"}
            </button>
          </div>
        </div>
      )}

      {/* merchandise purchase */}
      {canRegister && event.type === "merchandise" && (
        <div className="card bg-base-200 mb-4">
          <div className="card-body">
            <h3 className="font-semibold mb-2">Purchase</h3>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Select variant</span></label>
              <select
                className="select select-bordered w-full"
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
              >
                <option value="">Choose...</option>
                {event.merchDetails?.variants?.map((v) => (
                  <option key={v.variantId} value={v.variantId} disabled={v.stock <= 0}>
                    {v.label || `${v.size} / ${v.color}`} — {v.stock > 0 ? `${v.stock} in stock` : "Out of stock"}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control mb-3 max-w-xs">
              <label className="label"><span className="label-text">Quantity</span></label>
              <input
                type="number"
                className="input input-bordered"
                min="1"
                max={event.merchDetails?.purchaseLimitPerParticipant || 1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <button
              className={`btn btn-primary ${submitting ? "loading" : ""}`}
              onClick={handlePurchase}
              disabled={submitting}
            >
              {event.registrationFee > 0 ? `Buy (₹${event.registrationFee * quantity})` : "Get"}
            </button>
          </div>
        </div>
      )}

      {showTicket && <TicketModal ticketId={showTicket} onClose={() => setShowTicket(null)} />}

      {/* payment proof upload for pending merch orders */}
      {isRegistered && registration?.paymentStatus === "pending" && (
        <div className="card bg-base-200 mb-4">
          <div className="card-body">
            <h3 className="font-semibold mb-2">Upload Payment Proof</h3>
            {registration.paymentProof ? (
              <p className="text-sm text-success">Payment proof uploaded. Waiting for organizer to review.</p>
            ) : (
              <>
                <p className="text-sm opacity-60 mb-2">Upload a screenshot of your payment to complete the order.</p>
                <input
                  type="file"
                  className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append("paymentProof", file);
                    try {
                      await api.post(`/registrations/${registration.registrationId}/upload-proof`, fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                      toast.success("Payment proof uploaded! Organizer will review it.");
                    } catch (err) {
                      toast.error(err.response?.data?.error || "Upload failed");
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* team section for events that support teams */}
      {(event.status === "published" || event.status === "ongoing") && event.type === "normal" && (
        <TeamSection eventId={event._id} />
      )}

      {/* discussion forum */}
      {isRegistered && <ForumSection eventId={event._id} userName={user?.firstName || "Participant"} />}

      {/* feedback for completed events */}
      {isRegistered && (event.status === "completed" || event.status === "closed") && (
        <FeedbackSection eventId={event._id} />
      )}
    </div>
  );
}

function TeamSection({ eventId }) {
  const [teams, setTeams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [maxSize, setMaxSize] = useState(4);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    api.get("/teams/my").then(({ data }) => {
      setTeams(data.teams.filter((t) => t.eventId?._id === eventId || t.eventId === eventId));
    }).catch(() => {});
  }, [eventId]);

  const handleCreate = async () => {
    try {
      const { data } = await api.post("/teams/create", { eventId, teamName, maxSize });
      toast.success(`Team created! Invite code: ${data.team.inviteCode}`);
      setShowCreate(false);
      setTeams((prev) => [...prev, data.team]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    try {
      const { data } = await api.post("/teams/join", { inviteCode: inviteCode.trim() });
      toast.success("Joined team!");
      setInviteCode("");
      setTeams((prev) => [...prev, data.team]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  return (
    <div className="card bg-base-200 mb-4">
      <div className="card-body">
        <h3 className="font-semibold mb-2">Teams</h3>
        {teams.length > 0 ? (
          teams.map((t) => (
            <div key={t._id} className="mb-2 p-2 bg-base-100 rounded">
              <p className="font-medium text-sm">{t.teamName} <span className="opacity-50">({t.members?.length || 0}/{t.maxSize})</span></p>
              <p className="text-xs font-mono opacity-60">Invite: {t.inviteCode}</p>
              {t.isComplete && <span className="badge badge-sm badge-success mt-1">Complete</span>}
            </div>
          ))
        ) : (
          <p className="text-sm opacity-50 mb-2">No team yet for this event.</p>
        )}
        <div className="flex gap-2 mt-2">
          <input
            type="text" className="input input-bordered input-sm flex-1"
            placeholder="Enter invite code" value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          <button className="btn btn-sm btn-outline" onClick={handleJoin}>Join</button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(!showCreate)}>Create</button>
        </div>
        {showCreate && (
          <div className="flex gap-2 mt-2">
            <input type="text" className="input input-bordered input-sm flex-1" placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
            <input type="number" className="input input-bordered input-sm w-20" min="2" max="20" value={maxSize} onChange={(e) => setMaxSize(parseInt(e.target.value) || 2)} />
            <button className="btn btn-sm btn-primary" onClick={handleCreate}>Go</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ForumSection({ eventId, userName }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const fetchMessages = () => {
    api.get(`/forum/${eventId}/messages`).then(({ data }) => setMessages(data.messages || [])).catch(() => {});
  };

  useEffect(() => { fetchMessages(); }, [eventId]);

  // socket.io for real-time
  useEffect(() => {
    let socket;
    import("socket.io-client").then(({ io }) => {
      socket = io(import.meta.env.VITE_API_URL.replace("/api", ""));
      socket.emit("join-event", eventId);
      socket.on("message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
      socket.on("message-deleted", (msgId) => {
        setMessages((prev) => prev.filter((m) => m._id !== msgId));
      });
    });
    return () => { if (socket) { socket.emit("leave-event", eventId); socket.disconnect(); } };
  }, [eventId]);

  const handlePost = async () => {
    if (!content.trim()) return;
    try {
      const { data } = await api.post(`/forum/${eventId}/messages`, {
        content,
        parentId: replyTo,
        authorName: userName,
      });
      // socket will broadcast it
      setContent("");
      setReplyTo(null);
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to post");
    }
  };

  const handleReact = async (msgId, emoji) => {
    try {
      await api.put(`/forum/messages/${msgId}/react`, { emoji });
      fetchMessages();
    } catch {}
  };

  const topLevel = messages.filter((m) => !m.parentId);
  const replies = (parentId) => messages.filter((m) => m.parentId === parentId);

  return (
    <div className="card bg-base-200 mb-4">
      <div className="card-body">
        <h3 className="font-semibold mb-2">Discussion</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto mb-3">
          {topLevel.length === 0 && <p className="text-sm opacity-50">No messages yet. Start the conversation!</p>}
          {topLevel.map((m) => (
            <div key={m._id}>
              <div className={`p-2 rounded text-sm ${m.isPinned ? "bg-warning/10 border border-warning/30" : "bg-base-100"} ${m.isAnnouncement ? "border-l-4 border-primary" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">{m.authorName}</span>
                  <span className="text-xs opacity-40">{new Date(m.createdAt).toLocaleString()}</span>
                  {m.isPinned && <span className="badge badge-xs badge-warning">pinned</span>}
                  {m.isAnnouncement && <span className="badge badge-xs badge-primary">announcement</span>}
                </div>
                <p>{m.content}</p>
                <div className="flex gap-2 mt-1">
                  <button className="text-xs opacity-50 hover:opacity-100" onClick={() => setReplyTo(m._id)}>Reply</button>
                  <button className="text-xs opacity-50 hover:opacity-100" onClick={() => handleReact(m._id, "👍")}>👍</button>
                  <button className="text-xs opacity-50 hover:opacity-100" onClick={() => handleReact(m._id, "❤️")}>❤️</button>
                </div>
              </div>
              {replies(m._id).map((r) => (
                <div key={r._id} className="ml-6 mt-1 p-2 bg-base-100 rounded text-sm">
                  <span className="font-medium text-xs">{r.authorName}</span>
                  <span className="text-xs opacity-40 ml-2">{new Date(r.createdAt).toLocaleString()}</span>
                  <p>{r.content}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
        {replyTo && (
          <p className="text-xs opacity-50 mb-1">
            Replying to a message... <button className="link" onClick={() => setReplyTo(null)}>cancel</button>
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text" className="input input-bordered input-sm flex-1"
            placeholder="Type a message..." value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
          />
          <button className="btn btn-sm btn-primary" onClick={handlePost}>Send</button>
        </div>
      </div>
    </div>
  );
}

function FeedbackSection({ eventId }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) { toast.error("Please select a rating"); return; }
    try {
      await api.post(`/feedback/${eventId}`, { rating, comment });
      toast.success("Feedback submitted (anonymously)!");
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  if (submitted) return (
    <div className="card bg-base-200 mb-4">
      <div className="card-body text-center">
        <p className="text-sm opacity-60">Thanks for your feedback!</p>
      </div>
    </div>
  );

  return (
    <div className="card bg-base-200 mb-4">
      <div className="card-body">
        <h3 className="font-semibold mb-2">Leave Feedback (Anonymous)</h3>
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`text-2xl ${star <= rating ? "text-warning" : "opacity-30"}`}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          className="textarea textarea-bordered w-full mb-2" rows={2}
          placeholder="Optional comment..."
          value={comment} onChange={(e) => setComment(e.target.value)}
        />
        <button className="btn btn-sm btn-primary w-fit" onClick={handleSubmit}>Submit Feedback</button>
      </div>
    </div>
  );
}

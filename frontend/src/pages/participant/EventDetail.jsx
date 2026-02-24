import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";
import toast from "react-hot-toast";
import FormRenderer from "../../components/FormBuilder/FormRenderer";
import TicketModal from "../../components/TicketModal";

export default function EventDetail() {
  const { id } = useParams();
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
      setRegistration({ ticketId: data.ticketId, status: "confirmed" });
      toast.success("Purchase complete! Check your email.");
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
      {isRegistered && registration && (
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
    </div>
  );
}

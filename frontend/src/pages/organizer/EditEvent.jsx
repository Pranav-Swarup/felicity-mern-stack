import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import toast from "react-hot-toast";
import FormBuilder from "../../components/FormBuilder/FormBuilder";
import MerchBuilder from "../../components/MerchBuilder";

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({});
  const [customForm, setCustomForm] = useState([]);
  const [merchDetails, setMerchDetails] = useState({ variants: [], purchaseLimitPerParticipant: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/organizer/events/${id}`)
      .then(({ data }) => {
        const ev = data.event;
        setEvent(ev);
        setForm({
          name: ev.name || "",
          description: ev.description || "",
          type: ev.type || "normal",
          eligibility: ev.eligibility || "all",
          registrationDeadline: ev.registrationDeadline ? ev.registrationDeadline.slice(0, 16) : "",
          startDate: ev.startDate ? ev.startDate.slice(0, 16) : "",
          endDate: ev.endDate ? ev.endDate.slice(0, 16) : "",
          registrationLimit: ev.registrationLimit || "",
          registrationFee: ev.registrationFee || "",
          tags: (ev.tags || []).join(", "),
        });
        setCustomForm(ev.customForm || []);
        setMerchDetails(ev.merchDetails || { variants: [], purchaseLimitPerParticipant: 1 });
      })
      .catch(() => {
        toast.error("Event not found");
        navigate("/organizer/dashboard");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isDraft = event?.status === "draft";
  const isPublished = event?.status === "published";

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (isDraft) {
        payload.registrationLimit = parseInt(form.registrationLimit) || 0;
        payload.registrationFee = parseFloat(form.registrationFee) || 0;
        payload.tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
        payload.customForm = event.type === "normal" ? customForm : [];
        payload.merchDetails = event.type === "merchandise" ? merchDetails : undefined;
      }
      // published: backend only allows description, extending deadline, increasing limit
      await api.put(`/organizer/events/${id}`, payload);
      toast.success("Saved");
      navigate(`/organizer/events/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;
  }
  if (!event) return null;

  const readOnly = !isDraft && !isPublished;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Edit: {event.name}</h1>
      <span className="badge badge-ghost mb-4">{event.status}</span>

      {readOnly && (
        <div className="alert alert-warning mb-4">This event cannot be edited in its current status.</div>
      )}

      <div className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Event Name</span></label>
          <input type="text" className="input input-bordered w-full" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!isDraft} />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Description</span></label>
          <textarea className="textarea textarea-bordered w-full" rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={readOnly} />
        </div>

        {isDraft && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Start Date</span></label>
                <input type="datetime-local" className="input input-bordered w-full" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">End Date</span></label>
                <input type="datetime-local" className="input input-bordered w-full" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Tags</span></label>
              <input type="text" className="input input-bordered w-full" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Registration Deadline</span></label>
            <input type="datetime-local" className="input input-bordered w-full" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} disabled={readOnly} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Registration Limit</span></label>
            <input type="number" className="input input-bordered w-full" min="0" value={form.registrationLimit} onChange={(e) => setForm({ ...form, registrationLimit: e.target.value })} disabled={readOnly} />
          </div>
        </div>

        {isDraft && event.type === "normal" && !event.formLocked && (
          <div className="mt-4">
            <FormBuilder fields={customForm} onChange={setCustomForm} />
          </div>
        )}

        {isDraft && event.type === "merchandise" && (
          <div className="mt-4">
            <MerchBuilder merchDetails={merchDetails} onChange={setMerchDetails} />
          </div>
        )}

        {!readOnly && (
          <button className={`btn btn-primary ${saving ? "loading" : ""}`} onClick={handleSave} disabled={saving}>
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
}

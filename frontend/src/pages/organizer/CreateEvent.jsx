import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import toast from "react-hot-toast";
import FormBuilder from "../../components/FormBuilder/FormBuilder";
import MerchBuilder from "../../components/MerchBuilder";
import { HiArrowLeft, HiArrowRight } from "react-icons/hi";

const eligibilityOptions = [
  { value: "all", label: "Everyone" },
  { value: "iiit", label: "IIIT Students Only" },
  { value: "non-iiit", label: "Non-IIIT Only" },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "normal",
    eligibility: "all",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    registrationLimit: "",
    registrationFee: "",
    tags: "",
  });

  const [customForm, setCustomForm] = useState([]);
  const [merchDetails, setMerchDetails] = useState({
    variants: [],
    purchaseLimitPerParticipant: 1,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (publish = false) => {
    if (!form.name.trim()) {
      toast.error("Event name is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        registrationLimit: parseInt(form.registrationLimit) || 0,
        registrationFee: parseFloat(form.registrationFee) || 0,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        customForm: form.type === "normal" ? customForm : [],
        merchDetails: form.type === "merchandise" ? merchDetails : undefined,
      };

      const { data } = await api.post("/organizer/events", payload);

      if (publish) {
        await api.put(`/organizer/events/${data.event._id}/status`, { status: "published" });
        toast.success("Event published!");
      } else {
        toast.success("Draft saved!");
      }

      navigate("/organizer/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>

      {/* step indicator */}
      <ul className="steps steps-horizontal w-full mb-8">
        <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Basic Info</li>
        <li className={`step ${step >= 2 ? "step-primary" : ""}`}>
          {form.type === "merchandise" ? "Variants" : "Registration Form"}
        </li>
        <li className={`step ${step >= 3 ? "step-primary" : ""}`}>Review</li>
      </ul>

      {/* step 1: basic info */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Event Name</span></label>
            <input
              type="text" name="name" className="input input-bordered w-full"
              value={form.name} onChange={handleChange} required
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Description</span></label>
            <textarea
              name="description" className="textarea textarea-bordered w-full" rows={3}
              value={form.description} onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Event Type</span></label>
              <select name="type" className="select select-bordered w-full" value={form.type} onChange={handleChange}>
                <option value="normal">Normal Event</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Eligibility</span></label>
              <select name="eligibility" className="select select-bordered w-full" value={form.eligibility} onChange={handleChange}>
                {eligibilityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Start Date</span></label>
              <input type="datetime-local" name="startDate" className="input input-bordered w-full" value={form.startDate} onChange={handleChange} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">End Date</span></label>
              <input type="datetime-local" name="endDate" className="input input-bordered w-full" value={form.endDate} onChange={handleChange} />
            </div>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Registration Deadline</span></label>
            <input type="datetime-local" name="registrationDeadline" className="input input-bordered w-full" value={form.registrationDeadline} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Registration Limit (0 = unlimited)</span></label>
              <input type="number" name="registrationLimit" className="input input-bordered w-full" min="0" value={form.registrationLimit} onChange={handleChange} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Registration Fee (₹)</span></label>
              <input type="number" name="registrationFee" className="input input-bordered w-full" min="0" step="0.01" value={form.registrationFee} onChange={handleChange} />
            </div>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Tags (comma separated)</span></label>
            <input type="text" name="tags" className="input input-bordered w-full" placeholder="workshop, ai, beginner" value={form.tags} onChange={handleChange} />
          </div>

          <div className="flex justify-end mt-4">
            <button className="btn btn-primary gap-1" onClick={() => setStep(2)}>
              Next <HiArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* step 2: form builder OR merch variants */}
      {step === 2 && (
        <div>
          {form.type === "normal" ? (
            <FormBuilder fields={customForm} onChange={setCustomForm} />
          ) : (
            <MerchBuilder merchDetails={merchDetails} onChange={setMerchDetails} />
          )}

          <div className="flex justify-between mt-6">
            <button className="btn btn-ghost gap-1" onClick={() => setStep(1)}>
              <HiArrowLeft size={16} /> Back
            </button>
            <button className="btn btn-primary gap-1" onClick={() => setStep(3)}>
              Next <HiArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* step 3: review */}
      {step === 3 && (
        <div>
          <div className="card bg-base-200">
            <div className="card-body text-sm space-y-2">
              <h3 className="font-bold text-lg">{form.name || "Untitled Event"}</h3>
              <p className="opacity-70">{form.description || "No description"}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                <span className="opacity-50">Type</span><span>{form.type}</span>
                <span className="opacity-50">Eligibility</span><span>{eligibilityOptions.find((o) => o.value === form.eligibility)?.label}</span>
                <span className="opacity-50">Start</span><span>{form.startDate || "—"}</span>
                <span className="opacity-50">End</span><span>{form.endDate || "—"}</span>
                <span className="opacity-50">Deadline</span><span>{form.registrationDeadline || "—"}</span>
                <span className="opacity-50">Limit</span><span>{form.registrationLimit || "Unlimited"}</span>
                <span className="opacity-50">Fee</span><span>{form.registrationFee ? `₹${form.registrationFee}` : "Free"}</span>
                <span className="opacity-50">Tags</span><span>{form.tags || "—"}</span>
              </div>
              {form.type === "normal" && customForm.length > 0 && (
                <div className="mt-2">
                  <span className="opacity-50">Custom fields:</span> {customForm.length} field(s)
                </div>
              )}
              {form.type === "merchandise" && (
                <div className="mt-2">
                  <span className="opacity-50">Variants:</span> {merchDetails.variants.length} variant(s)
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button className="btn btn-ghost gap-1" onClick={() => setStep(2)}>
              <HiArrowLeft size={16} /> Back
            </button>
            <div className="flex gap-2">
              <button
                className={`btn btn-outline ${submitting ? "loading" : ""}`}
                onClick={() => handleSave(false)} disabled={submitting}
              >
                Save as Draft
              </button>
              <button
                className={`btn btn-primary ${submitting ? "loading" : ""}`}
                onClick={() => handleSave(true)} disabled={submitting}
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

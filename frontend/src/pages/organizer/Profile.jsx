import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import toast from "react-hot-toast";

const categories = ["Technical", "Cultural", "Sports", "Literary", "Social", "Other"];

export default function OrganizerProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    organizerName: "",
    category: "Other",
    description: "",
    contactEmail: "",
    contactNumber: "",
    discordWebhookUrl: "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        organizerName: user.organizerName || "",
        category: user.category || "Other",
        description: user.description || "",
        contactEmail: user.contactEmail || "",
        contactNumber: user.contactNumber || "",
        discordWebhookUrl: user.discordWebhookUrl || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/organizer/profile", form);
      updateUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await api.put("/organizer/password", passwordForm);
      toast.success("Password changed");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to change password");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Organizer Profile</h1>

      <div className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Login Email (non-editable)</span></label>
          <input type="text" className="input input-bordered w-full" value={user?.email || ""} disabled />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Organizer Name</span></label>
          <input
            type="text" className="input input-bordered w-full"
            value={form.organizerName}
            onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Category</span></label>
          <select className="select select-bordered w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Description</span></label>
          <textarea className="textarea textarea-bordered w-full" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Contact Email</span></label>
            <input type="email" className="input input-bordered w-full" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Contact Number</span></label>
            <input type="tel" className="input input-bordered w-full" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Discord Webhook URL</span></label>
          <input
            type="url" className="input input-bordered w-full"
            placeholder="https://discord.com/api/webhooks/..."
            value={form.discordWebhookUrl}
            onChange={(e) => setForm({ ...form, discordWebhookUrl: e.target.value })}
          />
          <label className="label"><span className="label-text-alt opacity-50">New events will be auto-posted here when published</span></label>
        </div>

        <button className={`btn btn-primary ${saving ? "loading" : ""}`} onClick={handleSave} disabled={saving}>
          Save Changes
        </button>
      </div>

      <div className="divider mt-8">Change Password</div>
      <form onSubmit={handlePasswordChange} className="space-y-3">
        <div className="form-control">
          <label className="label"><span className="label-text">Current Password</span></label>
          <input type="password" className="input input-bordered w-full" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">New Password</span></label>
          <input type="password" className="input input-bordered w-full" minLength={6} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
        </div>
        <button type="submit" className="btn btn-outline">Change Password</button>
      </form>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import toast from "react-hot-toast";

const interestOptions = ["Technical", "Cultural", "Sports", "Literary", "Social", "Gaming", "Music", "Art"];

export default function ParticipantProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: "", lastName: "", contactNumber: "", college: "", interests: [],
  });
  const [followedClubs, setFollowedClubs] = useState([]);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/participant/profile").then(({ data }) => {
      const u = data.user;
      setForm({
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        contactNumber: u.contactNumber || "",
        college: u.college || "",
        interests: u.interests || [],
      });
      setFollowedClubs(u.followedOrganizers || []);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (form.contactNumber && !/^\d{10}$/.test(form.contactNumber.trim())) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put("/participant/profile", form);
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
      await api.put("/participant/password", passwordForm);
      toast.success("Password changed");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const toggleInterest = (val) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(val)
        ? prev.interests.filter((i) => i !== val)
        : [...prev.interests, val],
    }));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Email (non-editable)</span></label>
          <input type="text" className="input input-bordered w-full" value={user?.email || ""} disabled />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Participant Type</span></label>
          <input type="text" className="input input-bordered w-full" value={user?.participantType || ""} disabled />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">First Name</span></label>
            <input type="text" className="input input-bordered w-full" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Last Name</span></label>
            <input type="text" className="input input-bordered w-full" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">College / Organization</span></label>
          <input type="text" className="input input-bordered w-full" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Contact Number</span></label>
          <input type="tel" className="input input-bordered w-full" placeholder="10 digits" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
        </div>

        <div>
          <label className="label"><span className="label-text">Interests</span></label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((opt) => (
              <button key={opt} onClick={() => toggleInterest(opt)} className={`btn btn-sm ${form.interests.includes(opt) ? "btn-primary" : "btn-outline"}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {followedClubs.length > 0 && (
          <div>
            <label className="label"><span className="label-text">Followed Clubs</span></label>
            <div className="flex flex-wrap gap-2">
              {followedClubs.map((c) => (
                <span key={c._id} className="badge badge-secondary">{c.organizerName}</span>
              ))}
            </div>
          </div>
        )}

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

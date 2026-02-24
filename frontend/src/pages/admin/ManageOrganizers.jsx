import { useEffect, useState } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";
import { HiPlus, HiTrash, HiEye, HiEyeOff, HiArchive } from "react-icons/hi";

const categories = ["Technical", "Cultural", "Sports", "Literary", "Social", "Other"];

export default function ManageOrganizers() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);

  const [form, setForm] = useState({
    organizerName: "",
    category: "Technical",
    description: "",
    contactEmail: "",
    contactNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchOrganizers = async () => {
    try {
      const { data } = await api.get("/admin/organizers");
      setOrganizers(data.organizers);
    } catch {
      toast.error("Failed to load organizers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.organizerName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/admin/organizers", form);
      setCreatedCreds(data.credentials);
      setForm({ organizerName: "", category: "Technical", description: "", contactEmail: "", contactNumber: "" });
      fetchOrganizers();
      toast.success("Organizer created!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create organizer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDisable = async (org) => {
    const action = org.isDisabled ? "enable" : "disable";
    try {
      await api.put(`/admin/organizers/${org._id}/${action}`);
      toast.success(`Organizer ${action}d`);
      fetchOrganizers();
    } catch {
      toast.error(`Failed to ${action} organizer`);
    }
  };

  const handleArchive = async (org) => {
    if (!confirm(`Archive "${org.organizerName}"? They won't be able to log in.`)) return;
    try {
      await api.put(`/admin/organizers/${org._id}/archive`);
      toast.success("Organizer archived");
      fetchOrganizers();
    } catch {
      toast.error("Failed to archive");
    }
  };

  const handleDelete = async (org) => {
    if (!confirm(`PERMANENTLY delete "${org.organizerName}" and ALL their events? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/organizers/${org._id}`);
      toast.success("Organizer permanently deleted");
      fetchOrganizers();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Clubs / Organizers</h1>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowModal(true)}>
          <HiPlus size={16} /> Add New
        </button>
      </div>

      {/* credentials display after creation */}
      {createdCreds && (
        <div className="alert alert-success mb-4">
          <div>
            <p className="font-semibold">New organizer credentials (save these!):</p>
            <p className="font-mono text-sm mt-1">
              Email: <strong>{createdCreds.email}</strong>
            </p>
            <p className="font-mono text-sm">
              Password: <strong>{createdCreds.password}</strong>
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setCreatedCreds(null)}>Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : organizers.length === 0 ? (
        <p className="text-center py-12 opacity-50">No organizers yet. Create one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizers.map((org) => (
                <tr key={org._id} className={org.isArchived ? "opacity-50" : ""}>
                  <td className="font-medium">{org.organizerName}</td>
                  <td className="text-sm opacity-70">{org.email}</td>
                  <td>
                    <span className="badge badge-sm badge-ghost">{org.category}</span>
                  </td>
                  <td>
                    {org.isArchived ? (
                      <span className="badge badge-sm badge-neutral">Archived</span>
                    ) : org.isDisabled ? (
                      <span className="badge badge-sm badge-warning">Disabled</span>
                    ) : (
                      <span className="badge badge-sm badge-success">Active</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {!org.isArchived && (
                        <button
                          className="btn btn-ghost btn-xs tooltip"
                          data-tip={org.isDisabled ? "Enable" : "Disable"}
                          onClick={() => handleToggleDisable(org)}
                        >
                          {org.isDisabled ? <HiEye size={14} /> : <HiEyeOff size={14} />}
                        </button>
                      )}
                      {!org.isArchived && (
                        <button
                          className="btn btn-ghost btn-xs tooltip"
                          data-tip="Archive"
                          onClick={() => handleArchive(org)}
                        >
                          <HiArchive size={14} />
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-xs text-error tooltip"
                        data-tip="Delete permanently"
                        onClick={() => handleDelete(org)}
                      >
                        <HiTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* create modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add New Organizer</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Organizer / Club Name</span></label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.organizerName}
                  onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
                  placeholder="e.g. Robotics Club"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Category</span></label>
                <select
                  className="select select-bordered w-full"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Description</span></label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Contact Email (public)</span></label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Contact Number</span></label>
                <input
                  type="tel"
                  className="input input-bordered w-full"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                />
              </div>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={`btn btn-primary ${submitting ? "loading" : ""}`} disabled={submitting}>
                  Create
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}
    </div>
  );
}

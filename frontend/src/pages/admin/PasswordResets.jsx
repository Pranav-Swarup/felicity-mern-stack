import { useEffect, useState } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";

export default function PasswordResets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState(null);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/password-resets/all");
      setRequests(data.requests || []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id) => {
    const comment = prompt("Comment (optional):");
    try {
      const { data } = await api.put(`/password-resets/${id}/approve`, { comment: comment || "" });
      setNewPassword({ id, password: data.newPassword });
      toast.success("Approved — new password generated");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve");
    }
  };

  const handleReject = async (id) => {
    const comment = prompt("Reason for rejection:");
    if (comment === null) return;
    try {
      await api.put(`/password-resets/${id}/reject`, { comment });
      toast.success("Rejected");
      fetchRequests();
    } catch {
      toast.error("Failed to reject");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Password Reset Requests</h1>

      {newPassword && (
        <div className="alert alert-success mb-4">
          <div>
            <p className="font-semibold">New password generated (share with the organizer):</p>
            <p className="font-mono text-sm mt-1"><strong>{newPassword.password}</strong></p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setNewPassword(null)}>Dismiss</button>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="opacity-50">No password reset requests.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Club</th>
                <th>Email</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td className="font-medium">{r.organizerId?.organizerName || "—"}</td>
                  <td className="text-sm opacity-70">{r.organizerId?.email || "—"}</td>
                  <td className="text-sm max-w-[200px] truncate">{r.reason || "—"}</td>
                  <td>
                    <span className={`badge badge-sm ${
                      r.status === "pending" ? "badge-warning" :
                      r.status === "approved" ? "badge-success" : "badge-error"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-xs opacity-50">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="text-sm max-w-[200px] truncate">{r.adminComment || "—"}</td>
                  <td>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <button className="btn btn-xs btn-success" onClick={() => handleApprove(r._id)}>Approve</button>
                        <button className="btn btn-xs btn-error" onClick={() => handleReject(r._id)}>Reject</button>
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

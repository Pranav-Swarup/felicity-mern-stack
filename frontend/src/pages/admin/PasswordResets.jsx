import { useEffect, useState } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";

export default function PasswordResets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [generatedPw, setGeneratedPw] = useState(null);

  const fetch = async () => {
    try {
      const { data } = await api.get("/password-resets/all");
      setRequests(data.requests || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleApprove = async (id) => {
    try {
      const { data } = await api.put(`/password-resets/${id}/approve`, { comment });
      setGeneratedPw({ id, password: data.newPassword, name: data.request.organizerId?.organizerName || "" });
      toast.success("Approved");
      setComment("");
      setActiveId(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/password-resets/${id}/reject`, { comment });
      toast.success("Rejected");
      setComment("");
      setActiveId(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Password Reset Requests</h1>

      {generatedPw && (
        <div className="alert alert-success mb-4">
          <div>
            <p className="font-semibold">New password for {generatedPw.name}:</p>
            <p className="font-mono">{generatedPw.password}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setGeneratedPw(null)}>Dismiss</button>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="opacity-50">No requests.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className="card bg-base-200">
              <div className="card-body py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{r.organizerId?.organizerName || "Unknown"}</p>
                    <p className="text-xs opacity-50">{r.organizerId?.email} • {new Date(r.createdAt).toLocaleDateString()}</p>
                    {r.reason && <p className="text-sm mt-1">Reason: {r.reason}</p>}
                    {r.adminComment && <p className="text-sm opacity-60 mt-1">Comment: {r.adminComment}</p>}
                  </div>
                  <span className={`badge badge-sm ${r.status === "pending" ? "badge-warning" : r.status === "approved" ? "badge-success" : "badge-error"}`}>
                    {r.status}
                  </span>
                </div>

                {r.status === "pending" && (
                  <div className="mt-3">
                    {activeId === r._id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="input input-bordered input-sm w-full"
                          placeholder="Comment (optional)"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(r._id)}>Approve</button>
                          <button className="btn btn-error btn-sm" onClick={() => handleReject(r._id)}>Reject</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setActiveId(null); setComment(""); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-outline" onClick={() => setActiveId(r._id)}>Review</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

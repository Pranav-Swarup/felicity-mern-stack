import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import toast from "react-hot-toast";

export default function ClubsList() {
  const { user, updateUser } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [followed, setFollowed] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/organizers"),
      api.get("/participant/profile"),
    ]).then(([orgRes, profRes]) => {
      setOrganizers(orgRes.data.organizers || []);
      const ids = (profRes.data.user.followedOrganizers || []).map((o) => o._id || o);
      setFollowed(new Set(ids));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (orgId) => {
    const isFollowing = followed.has(orgId);
    try {
      if (isFollowing) {
        await api.delete(`/organizers/${orgId}/follow`);
        setFollowed((prev) => { const s = new Set(prev); s.delete(orgId); return s; });
        toast.success("Unfollowed");
      } else {
        await api.post(`/organizers/${orgId}/follow`);
        setFollowed((prev) => new Set(prev).add(orgId));
        toast.success("Followed!");
      }
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clubs & Organizers</h1>
      {organizers.length === 0 ? (
        <p className="opacity-50">No organizers yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizers.map((org) => (
            <div key={org._id} className="card bg-base-200">
              <div className="card-body py-4 px-5">
                <div className="flex items-start justify-between">
                  <Link to={`/clubs/${org._id}`} className="flex-1">
                    <h3 className="font-semibold hover:underline">{org.organizerName}</h3>
                    <span className="badge badge-sm badge-ghost mt-1">{org.category}</span>
                    <p className="text-sm opacity-60 mt-1 line-clamp-2">{org.description || "No description"}</p>
                  </Link>
                  <button
                    className={`btn btn-sm ml-3 ${followed.has(org._id) ? "btn-secondary" : "btn-outline"}`}
                    onClick={() => handleToggle(org._id)}
                  >
                    {followed.has(org._id) ? "Following" : "Follow"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

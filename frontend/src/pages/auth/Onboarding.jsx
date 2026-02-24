import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import toast from "react-hot-toast";

const interestOptions = [
  "Technical",
  "Cultural",
  "Sports",
  "Literary",
  "Social",
  "Gaming",
  "Music",
  "Art",
];

export default function Onboarding() {
  const [interests, setInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [followedIds, setFollowedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/organizers").then(({ data }) => {
      setOrganizers(data.organizers || []);
    }).catch(() => {});
  }, []);

  const toggleInterest = (val) => {
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  };

  const toggleFollow = (id) => {
    setFollowedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.put("/participant/preferences", {
        interests,
        followedOrganizers: followedIds,
      });
      updateUser(data.user);
      toast.success("Preferences saved!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await api.put("/participant/preferences", {
        interests: [],
        followedOrganizers: [],
        skip: true,
      });
    } catch {}
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 py-8">
      <div className="card w-full max-w-lg bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl justify-center">Welcome! Set your preferences</h2>
          <p className="text-center text-sm opacity-70 mb-4">
            Pick what interests you. You can always change this later.
          </p>

          <div>
            <h3 className="font-semibold mb-2">Areas of Interest</h3>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleInterest(opt)}
                  className={`btn btn-sm ${interests.includes(opt) ? "btn-primary" : "btn-outline"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {organizers.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Follow Clubs</h3>
              <div className="flex flex-wrap gap-2">
                {organizers.map((org) => (
                  <button
                    key={org._id}
                    onClick={() => toggleFollow(org._id)}
                    className={`btn btn-sm ${followedIds.includes(org._id) ? "btn-secondary" : "btn-outline"}`}
                  >
                    {org.organizerName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={handleSkip} className="btn btn-ghost flex-1">
              Skip for now
            </button>
            <button
              onClick={handleSave}
              className={`btn btn-primary flex-1 ${submitting ? "loading" : ""}`}
              disabled={submitting}
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

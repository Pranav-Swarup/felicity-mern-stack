import { useAuth } from "../../context/AuthContext";

export default function ParticipantDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Dashboard</h1>
      <p className="opacity-70">Welcome back, {user?.firstName}!</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Upcoming Events</h2>
            <p className="opacity-50 text-sm">No upcoming events yet.</p>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Participation History</h2>
            <p className="opacity-50 text-sm">Nothing here yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

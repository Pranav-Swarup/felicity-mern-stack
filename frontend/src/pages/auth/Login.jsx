import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const roles = [
  { value: "participant", label: "Participant" },
  { value: "organizer", label: "Organizer" },
  { value: "admin", label: "Admin" },
];

const dashboardPaths = {
  participant: "/dashboard",
  organizer: "/organizer/dashboard",
  admin: "/admin/dashboard",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("participant");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await login(email, password, selectedRole);
      toast.success("Logged in!");
      navigate(dashboardPaths[data.role]);
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* left half — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/80 to-secondary/60 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-16 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <h1 className="text-6xl font-extrabold text-white tracking-tight mb-4">Felicity</h1>
          <p className="text-xl text-white/80 font-light">Where events come together.</p>
        </div>
      </div>

      {/* right half — form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 bg-base-100">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Felicity Dashboard</h2>
            <p className="text-sm text-base-content/50 mt-1">2026</p>
          </div>

          <div role="tablist" className="tabs tabs-boxed mb-6 bg-base-200">
            {roles.map((r) => (
              <button
                key={r.value}
                role="tab"
                className={`tab flex-1 ${selectedRole === r.value ? "tab-active" : ""}`}
                onClick={() => setSelectedRole(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text text-sm">Email</span></label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text text-sm">Password</span></label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className={`btn btn-primary w-full ${submitting ? "loading" : ""}`}
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {selectedRole === "participant" && (
            <p className="text-center text-sm mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="link link-primary font-medium">Register</Link>
            </p>
          )}
          {selectedRole === "organizer" && (
            <p className="text-center text-sm mt-6 text-base-content/50">
              Organizer accounts are created by the admin.
            </p>
          )}
        </div>

        <p className="text-xs text-base-content/30 mt-12">made by pranav :)</p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    contactNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (form.contactNumber && !/^\d{10}$/.test(form.contactNumber.trim())) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        college: form.college,
        contactNumber: form.contactNumber,
      });
      toast.success("Account created!");
      navigate("/onboarding");
    } catch (err) {
      const msg = err.response?.data?.error || "Registration failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // quick check if email looks like IIIT
  const isIIIT =
    form.email.endsWith("@iiit.ac.in") ||
    form.email.endsWith("@students.iiit.ac.in") ||
    form.email.endsWith("@research.iiit.ac.in");

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 py-8">
      <div className="card w-full max-w-md bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl justify-center mb-2">Create Account</h2>

          {form.email && (
            <div className={`badge ${isIIIT ? "badge-success" : "badge-info"} mx-auto`}>
              {isIIIT ? "IIIT Student" : "Non-IIIT Participant"}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text">First Name</span></label>
                <input
                  type="text"
                  name="firstName"
                  className="input input-bordered w-full"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Last Name</span></label>
                <input
                  type="text"
                  name="lastName"
                  className="input input-bordered w-full"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Email</span></label>
              <input
                type="email"
                name="email"
                className="input input-bordered w-full"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">College / Organization</span></label>
              <input
                type="text"
                name="college"
                className="input input-bordered w-full"
                value={form.college}
                onChange={handleChange}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Contact Number</span></label>
              <input
                type="tel"
                name="contactNumber"
                className="input input-bordered w-full"
                value={form.contactNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Password</span></label>
              <input
                type="password"
                name="password"
                className="input input-bordered w-full"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Confirm Password</span></label>
              <input
                type="password"
                name="confirmPassword"
                className="input input-bordered w-full"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${submitting ? "loading" : ""}`}
              disabled={submitting}
            >
              {submitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HiOutlineLogout } from "react-icons/hi";

const navLinks = {
  participant: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/events", label: "Browse Events" },
    { to: "/clubs", label: "Clubs" },
    { to: "/profile", label: "Profile" },
  ],
  organizer: [
    { to: "/organizer/dashboard", label: "Dashboard" },
    { to: "/organizer/events/create", label: "Create Event" },
    { to: "/organizer/ongoing", label: "Ongoing Events" },
    { to: "/organizer/profile", label: "Profile" },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/organizers", label: "Manage Clubs" },
    { to: "/admin/password-resets", label: "Password Resets" },
  ],
};

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const links = navLinks[role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-200 px-4 shadow-sm">
      <div className="flex-1">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Felicity
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1 gap-1">
          {links.map((link) => (
            <li key={link.to}>
              <Link to={link.to}>{link.label}</Link>
            </li>
          ))}
          <li>
            <button onClick={handleLogout} className="text-error">
              <HiOutlineLogout size={18} />
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

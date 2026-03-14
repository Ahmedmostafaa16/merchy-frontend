import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const Sidebar = () => {
  const location = useLocation();
  const search = location.search || "";

  const linkClassName = ({ isActive }) => (
    `flex items-center rounded-xl px-4 py-3 text-sm transition-colors ${
      isActive ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
    }`
  );

  return (
    <aside className="dashboard-panel h-fit p-6">
      <div className="mb-8 flex items-center">
        <img
          src={logo}
          alt="Merchy"
          className="h-32 w-auto object-contain"
        />
      </div>

      <nav className="space-y-2">
        <NavLink to={`/overview${search}`} className={linkClassName}>
          Overview
        </NavLink>
        <NavLink to={`/raw-data${search}`} className={linkClassName}>
          Raw Data
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;

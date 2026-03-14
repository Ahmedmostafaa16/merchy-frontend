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
    <aside className="dashboard-panel sticky top-4 flex min-h-[calc(100vh-3rem)] flex-col p-5">
      <div className="mb-10 flex items-center">
        <img
          src={logo}
          alt="Merchy"
          className="h-12 w-auto object-contain"
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

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="text-sm font-medium text-white">Store Admin</div>
        <div className="mt-1 text-xs text-zinc-400">Shopify Plus</div>
      </div>
    </aside>
  );
};

export default Sidebar;

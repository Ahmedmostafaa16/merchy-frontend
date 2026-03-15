import { Boxes, LayoutDashboard } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const Sidebar = () => {
  const location = useLocation();
  const search = location.search || "";

  const linkClassName = ({ isActive }) => (
    `flex items-center gap-[10px] rounded-[10px] px-[14px] py-[10px] text-sm transition-colors ${
      isActive ? "bg-[rgba(47,111,237,0.25)] text-white" : "text-zinc-300 hover:bg-[rgba(47,111,237,0.18)] hover:text-white"
    }`
  );

  return (
    <aside className="dashboard-panel sticky top-4 flex w-[240px] min-h-[calc(100vh-3rem)] flex-col px-5 pb-5 pt-0">
      <div className="flex items-center">
        <img
          src={logo}
          alt="Merchy"
          className="h-24 w-auto object-contain"
        />
      </div>

      <nav className="mt-10 space-y-2">
        <NavLink to={`/overview${search}`} className={linkClassName}>
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </NavLink>
        <NavLink to={`/raw-data${search}`} className={linkClassName}>
          <Boxes size={18} />
          <span>Raw Data</span>
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

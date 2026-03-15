import { Boxes, Database, LayoutDashboard, Package, Settings2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const Sidebar = ({ page = "overview" }) => {
  const location = useLocation();
  const search = location.search || "";

  const isConfigurationsPage = page === "overview";

  const darkLinkClassName = ({ isActive }) => (
    `flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition-colors ${
      isActive ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
    }`
  );

  return (
    <aside
      className={`sticky top-4 flex min-h-[calc(100vh-3rem)] flex-col p-5 ${
        isConfigurationsPage
          ? "dashboard-panel"
          : "dashboard-panel"
      }`}
    >
      <div className="mb-10 flex items-center">
        <img
          src={logo}
          alt="Merchy"
          className="h-24 w-auto object-contain"
        />
      </div>

      {isConfigurationsPage ? (
        <nav className="space-y-2">
          <button type="button" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button type="button" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white">
            <Package size={18} />
            <span>Inventory</span>
          </button>
          <button type="button" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white">
            <Boxes size={18} />
            <span>Forecast</span>
          </button>
          <NavLink to={`/raw-data${search}`} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white">
            <Database size={18} />
            <span>Raw Data</span>
          </NavLink>
          <NavLink to={`/overview${search}`} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">
            <Settings2 size={18} />
            <span>Configurations</span>
          </NavLink>
        </nav>
      ) : (
        <nav className="space-y-2">
          <NavLink to={`/overview${search}`} className={darkLinkClassName}>
            <LayoutDashboard size={18} />
            <span className="ml-2">Overview</span>
          </NavLink>
          <NavLink to={`/raw-data${search}`} className={darkLinkClassName}>
            <Boxes size={18} />
            <span className="ml-2">Raw Data</span>
          </NavLink>
        </nav>
      )}

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="text-sm font-medium text-white">Store Admin</div>
        <div className="mt-1 text-xs text-zinc-400">Shopify Plus</div>
      </div>
    </aside>
  );
};

export default Sidebar;

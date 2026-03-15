import { Boxes, LayoutDashboard, Package, Settings2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const Sidebar = ({ page = "overview" }) => {
  const location = useLocation();
  const search = location.search || "";

  const isConfigurationsPage = page === "overview";

  const lightNavItemClass =
    "flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]";
  const activeLightNavItemClass =
    "flex items-center rounded-2xl bg-[#DCEAFE] px-4 py-3 text-sm font-semibold text-[#197FE6]";

  const darkLinkClassName = ({ isActive }) => (
    `flex items-center rounded-xl px-4 py-3 text-sm transition-colors ${
      isActive ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
    }`
  );

  return (
    <aside
      className={`sticky top-4 flex min-h-[calc(100vh-3rem)] flex-col p-5 ${
        isConfigurationsPage
          ? "rounded-2xl border border-[#E2E8F0] bg-white shadow-sm"
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
          <button type="button" className={lightNavItemClass}>
            <LayoutDashboard size={18} />
            <span className="ml-2">Dashboard</span>
          </button>
          <button type="button" className={lightNavItemClass}>
            <Package size={18} />
            <span className="ml-2">Inventory</span>
          </button>
          <button type="button" className={lightNavItemClass}>
            <Boxes size={18} />
            <span className="ml-2">Forecast</span>
          </button>
          <NavLink to={`/overview${search}`} className={activeLightNavItemClass}>
            <Settings2 size={18} />
            <span className="ml-2">Configurations</span>
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

      <div className={`mt-auto pt-5 ${isConfigurationsPage ? "border-t border-[#E2E8F0]" : "border-t border-white/10"}`}>
        <div className={`text-sm font-medium ${isConfigurationsPage ? "text-[#0F172A]" : "text-white"}`}>Store Admin</div>
        <div className={`mt-1 text-xs ${isConfigurationsPage ? "text-[#64748B]" : "text-zinc-400"}`}>Shopify Plus</div>
      </div>
    </aside>
  );
};

export default Sidebar;

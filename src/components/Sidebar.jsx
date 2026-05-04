import { BarChart3, Boxes, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, Settings } from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const Sidebar = ({ settingsEmail = "" }) => {
  const location = useLocation();
  const search = location.search || "";
  const [collapsed, setCollapsed] = useState(false);

  const linkClassName = ({ isActive }) => (
    `flex w-full items-center rounded-[10px] py-[10px] text-sm transition-colors ${
      collapsed ? "justify-center px-0" : "gap-[10px] px-[14px]"
    } ${
      isActive
        ? "bg-[rgba(47,111,237,0.25)] text-white"
        : "text-zinc-300 hover:bg-[rgba(47,111,237,0.18)] hover:text-white"
    }`
  );

  return (
    <aside className={`dashboard-panel sticky top-0 flex min-h-screen flex-col px-4 py-6 transition-[width,min-width] duration-300 ease-in-out ${
      collapsed ? "w-[76px] min-w-[76px]" : "w-[240px] min-w-[240px]"
    }`}>
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed ? (
          <img
            src={logo}
            alt="Merchy"
            className="h-20 w-auto object-contain"
          />
        ) : null}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((current) => !current)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="mt-6 flex flex-col gap-[10px]">
        <NavLink to={`/dashboard${search}`} className={linkClassName} title="Dashboard">
          <BarChart3 size={18} />
          {!collapsed ? <span>Dashboard</span> : null}
        </NavLink>
        <NavLink to={`/overview${search}`} className={linkClassName}>
          <LayoutDashboard size={18} />
          {!collapsed ? <span>Overview</span> : null}
        </NavLink>
        <NavLink to={`/replenish${search}`} className={linkClassName} title="Replenish">
          <Boxes size={18} />
          {!collapsed ? <span>Replenish</span> : null}
        </NavLink>
        <NavLink to={`/po${search}`} className={linkClassName} title="Purchase Orders">
          <ClipboardList size={18} />
          {!collapsed ? <span>Purchase Orders</span> : null}
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <NavLink to={`/settings${search}`} className={linkClassName} title="Settings">
          <Settings size={18} />
          {!collapsed ? <div className="min-w-0">
            <div className="text-sm font-medium">Settings</div>
            {settingsEmail ? (
              <div className="mt-1 truncate text-xs text-zinc-400">{settingsEmail}</div>
            ) : null}
          </div> : null}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;

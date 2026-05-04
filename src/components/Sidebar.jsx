import { BarChart3, Boxes, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, Settings } from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const Sidebar = ({ settingsEmail = "" }) => {
  const location = useLocation();
  const search = location.search || "";
  const [collapsed, setCollapsed] = useState(false);

  const linkClassName = ({ isActive }) => (
    `flex h-11 w-full items-center rounded-[8px] text-sm transition-colors ${
      collapsed ? "justify-center px-0" : "gap-3 px-3"
    } ${
      isActive
        ? "bg-[rgba(47,111,237,0.25)] text-white"
        : "text-zinc-300 hover:bg-[rgba(47,111,237,0.18)] hover:text-white"
    }`
  );

  return (
    <aside className={`dashboard-panel sticky top-0 flex min-h-screen flex-col border-r border-white/10 px-3 py-4 transition-[width,min-width] duration-300 ease-in-out ${
      collapsed ? "w-[60px] min-w-[60px]" : "w-[184px] min-w-[184px]"
    }`}>
      <div className={`relative flex h-9 items-center ${collapsed ? "justify-center" : "justify-start"}`}>
        {!collapsed ? (
          <img
            src={logo}
            alt="Merchy"
            className="h-7 w-auto object-contain"
          />
        ) : null}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((current) => !current)}
          className={`absolute inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0b1020] text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white ${
            collapsed ? "left-1/2 -translate-x-1/2" : "-right-[26px]"
          }`}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <nav className="mt-5 flex flex-col gap-2">
        <NavLink to={`/dashboard${search}`} className={linkClassName} title="Dashboard">
          <BarChart3 size={18} />
          {!collapsed ? <span>Dashboard</span> : null}
        </NavLink>
        <NavLink to={`/overview${search}`} className={linkClassName} title="Overview">
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

      <div className="mt-auto border-t border-white/10 pt-4">
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

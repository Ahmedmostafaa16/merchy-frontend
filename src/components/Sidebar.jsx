import { BarChart3, Boxes, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, Settings } from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const Sidebar = ({ page = "", settingsEmail = "" }) => {
  const location = useLocation();
  const search = location.search || "";
  const [collapsed, setCollapsed] = useState(false);

  const linkClassName = ({ isActive }) => (
    `group flex h-11 w-full items-center rounded-xl text-sm font-medium transition-all duration-200 ${
      collapsed ? "justify-center px-0" : "gap-3 px-3"
    } ${
      isActive
        ? "bg-[#EFF6FF] text-[#2563EB] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.12)]"
        : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#111827]"
    }`
  );

  const edgeFillClassName = page === "replenish"
    ? "-ml-2 -mt-4 min-h-[calc(100vh+2rem)] sm:-ml-3 lg:-ml-4"
    : "-ml-8 -mt-8 min-h-[calc(100vh+4rem)]";

  return (
    <aside className={`dashboard-panel sticky top-0 flex flex-col border-r border-[#E5E7EB] px-4 py-5 transition-[width,min-width] duration-300 ease-in-out ${edgeFillClassName} ${
      collapsed ? "w-[68px] min-w-[68px]" : "w-[212px] min-w-[212px]"
    }`}>
      <div className={`relative flex h-14 items-center ${collapsed ? "justify-center" : "justify-start"}`}>
        {!collapsed ? (
          <img
            src={logo}
            alt="Merchy"
            className="h-24 w-auto object-contain"
          />
        ) : null}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((current) => !current)}
          className={`absolute inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#64748B] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#2563EB] ${
            collapsed ? "left-1/2 -translate-x-1/2" : "-right-[30px]"
          }`}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <nav className="mt-5 flex flex-col gap-2">
        <NavLink to={`/overview${search}`} className={linkClassName} title="Overview">
          <LayoutDashboard size={18} />
          {!collapsed ? <span>Overview</span> : null}
        </NavLink>
        <NavLink to={`/replenish${search}`} className={linkClassName} title="Replenish">
          <Boxes size={18} />
          {!collapsed ? <span>Replenish</span> : null}
        </NavLink>
        <NavLink to={`/dashboard${search}`} className={linkClassName} title="Dashboard">
          <BarChart3 size={18} />
          {!collapsed ? <span>Dashboard</span> : null}
        </NavLink>
        <NavLink to={`/po${search}`} className={linkClassName} title="Purchase Orders">
          <ClipboardList size={18} />
          {!collapsed ? <span>Purchase Orders</span> : null}
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-[#E5E7EB] pt-4">
        <NavLink to={`/settings${search}`} className={linkClassName} title="Settings">
          <Settings size={18} />
          {!collapsed ? <div className="min-w-0">
            <div className="text-sm font-medium">Settings</div>
            {settingsEmail ? (
              <div className="mt-1 truncate text-xs text-[#94A3B8]">{settingsEmail}</div>
            ) : null}
          </div> : null}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;

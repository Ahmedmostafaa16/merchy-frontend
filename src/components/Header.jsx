import { Bell, Settings, User } from "lucide-react";

const Header = ({ lastSyncLabel = "never" }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-tight text-[#0F172A]">Overview</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Manage forecast settings, review sync timing, and configure notification preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#334155] shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
            <span>Last synced: {lastSyncLabel}</span>
          </div>
          <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] shadow-sm">
            <Settings size={20} />
          </button>
          <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] shadow-sm">
            <Bell size={20} />
          </button>
          <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F3C7A7] text-white shadow-sm">
            <User size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-8 border-b border-[#E2E8F0]">
        <button type="button" className="border-b-2 border-transparent pb-3 text-sm font-semibold text-[#64748B]">
          General
        </button>
        <button
          type="button"
          className="border-b-2 border-[#197FE6] pb-3 text-sm font-semibold text-[#197FE6]"
        >
          Configurations
        </button>
        <button type="button" className="border-b-2 border-transparent pb-3 text-sm font-semibold text-[#64748B]">
          Team
        </button>
      </div>
    </div>
  );
};

export default Header;

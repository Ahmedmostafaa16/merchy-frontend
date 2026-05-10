const Header = ({ lastSyncLabel = "never" }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-tight tracking-tight text-[#111827]">Overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">
            Manage forecast settings, review sync timing, and configure notification preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-2 text-[13px] font-semibold text-[#047857] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
            <span>Last synced: {lastSyncLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

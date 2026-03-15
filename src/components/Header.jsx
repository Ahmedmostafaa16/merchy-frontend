const Header = ({ lastSyncLabel = "never" }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-tight text-white">Overview</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage forecast settings, review sync timing, and configure notification preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-[10px] py-[6px] text-[13px] font-medium text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
            <span>Last synced: {lastSyncLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

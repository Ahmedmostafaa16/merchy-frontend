const Header = () => {
  return (
    <header className="h-16 w-full bg-black text-white">
      <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
            D
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">DuckPack</p>
            <p className="text-xs text-zinc-300">Inventory Forecasting</p>
          </div>
        </div>

        <div className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1 text-xs font-medium text-zinc-200">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Connected
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold">
            A
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-300">
            v
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

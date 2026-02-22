const Tabs = ({ tabs = [], activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab === activeTab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
              active
                ? "border-black bg-black text-white"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;

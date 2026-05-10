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
            className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              active
                ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                : "border-[#E5E7EB] bg-white text-[#64748B] hover:border-[#BFDBFE] hover:bg-[#F8FAFC] hover:text-[#111827]"
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

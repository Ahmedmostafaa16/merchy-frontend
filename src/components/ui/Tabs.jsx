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
                ? "border-[#6A329F] bg-[rgba(106,50,159,0.2)] text-[#f2ebff] shadow-[0_0_0_1px_rgba(106,50,159,0.35),0_0_30px_rgba(106,50,159,0.2)]"
                : "border-[#2a3861] bg-[#101a36] text-[#a4b0d4] hover:border-[#6A329F] hover:bg-[rgba(106,50,159,0.14)] hover:text-[#ddd3f6]"
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

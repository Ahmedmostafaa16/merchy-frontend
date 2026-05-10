const PillChip = ({ children, active = false, className = "", onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
        active
          ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          : "border-[#E5E7EB] bg-white text-[#64748B] hover:border-[#BFDBFE] hover:bg-[#F8FAFC] hover:text-[#111827]"
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default PillChip;

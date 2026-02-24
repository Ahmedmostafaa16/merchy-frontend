const PillChip = ({ children, active = false, className = "", onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-[#6A329F] bg-[rgba(106,50,159,0.22)] text-[#efe6ff] shadow-[0_0_0_1px_rgba(106,50,159,0.35),0_0_24px_rgba(106,50,159,0.18)]"
          : "border-[#23345f] bg-[#111b38] text-[#9aa8cc] hover:border-[#6A329F] hover:bg-[rgba(106,50,159,0.16)] hover:text-[#ddd3f6]"
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default PillChip;

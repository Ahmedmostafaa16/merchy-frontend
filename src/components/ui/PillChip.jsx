const PillChip = ({ children, active = false, className = "" }) => {
  return (
    <button
      type="button"
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-black bg-black text-white"
          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default PillChip;

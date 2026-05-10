const stylesByVariant = {
  primary:
    "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] hover:border-[#1D4ED8] hover:bg-[#1D4ED8] hover:shadow-[0_14px_30px_rgba(37,99,235,0.28)] active:bg-[#1E40AF] focus-visible:ring-[rgba(37,99,235,0.26)]",
  secondary:
    "border-[#E5E7EB] bg-white text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] hover:text-[#111827] focus-visible:ring-[rgba(37,99,235,0.18)]",
  disabled:
    "cursor-not-allowed border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]",
};

const Button = ({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
  onClick,
}) => {
  const resolvedVariant = disabled ? "disabled" : variant;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-0 ${stylesByVariant[resolvedVariant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

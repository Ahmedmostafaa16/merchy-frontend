const stylesByVariant = {
  primary:
    "border-[#7DD3FC] bg-[#7DD3FC] text-[#111827] shadow-none hover:border-[#38BDF8] hover:bg-[#38BDF8] active:bg-[#0EA5E9] focus-visible:ring-[rgba(56,189,248,0.3)]",
  secondary:
    "border-[#D1D5DB] bg-white text-[#111827] shadow-none hover:bg-[#F9FAFB] focus-visible:ring-[rgba(56,189,248,0.3)]",
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
      className={`inline-flex h-11 w-full items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${stylesByVariant[resolvedVariant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

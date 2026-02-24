const stylesByVariant = {
  primary:
    "border-[#6A329F] bg-gradient-to-b from-[#6A329F] to-[#522081] text-white shadow-[0_0_0_1px_rgba(106,50,159,0.25),0_8px_24px_rgba(106,50,159,0.25)] hover:from-[#601F9E] hover:to-[#522081] active:from-[#522081] active:to-[#522081] focus-visible:ring-[rgba(106,50,159,0.35)]",
  secondary:
    "border-[#24335e] bg-[#121c3a] text-[#dbe4ff] hover:bg-[#18264d] focus-visible:ring-[rgba(106,50,159,0.35)]",
  disabled:
    "cursor-not-allowed border-[#1f2b4f] bg-[#151e37] text-[#5e6b93]",
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

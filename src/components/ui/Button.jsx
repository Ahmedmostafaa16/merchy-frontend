const stylesByVariant = {
  primary:
    "bg-black text-white border-black hover:bg-zinc-900 focus-visible:ring-black",
  secondary:
    "bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-50 focus-visible:ring-zinc-400",
  disabled:
    "bg-zinc-200 text-zinc-500 border-zinc-200 cursor-not-allowed",
};

const Button = ({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}) => {
  const resolvedVariant = disabled ? "disabled" : variant;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex h-11 w-full items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${stylesByVariant[resolvedVariant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

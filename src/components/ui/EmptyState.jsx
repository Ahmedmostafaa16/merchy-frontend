const EmptyState = ({
  title = "No data yet",
  subtitle = "",
  className = "",
}) => {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center ${className}`}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle ? <p className="mt-2 text-sm text-zinc-400">{subtitle}</p> : null}
    </div>
  );
};

export default EmptyState;

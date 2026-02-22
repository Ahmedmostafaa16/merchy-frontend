const Skeleton = ({ className = "" }) => {
  return <div className={`animate-pulse rounded-full bg-zinc-200 ${className}`} aria-hidden="true" />;
};

export default Skeleton;

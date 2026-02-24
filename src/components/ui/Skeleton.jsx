const Skeleton = ({ className = "" }) => {
  return <div className={`animate-pulse rounded-full bg-[#253762] ${className}`} aria-hidden="true" />;
};

export default Skeleton;

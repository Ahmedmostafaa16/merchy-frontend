const Skeleton = ({ className = "" }) => {
  return <div className={`animate-pulse rounded-full bg-gradient-to-r from-[#E5E7EB] via-[#F1F5F9] to-[#E5E7EB] ${className}`} aria-hidden="true" />;
};

export default Skeleton;

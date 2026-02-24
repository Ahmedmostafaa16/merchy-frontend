const Card = ({ className = "", children }) => {
  return (
    <section
      className={`rounded-2xl border border-[#23345f] bg-[linear-gradient(180deg,rgba(13,24,52,0.94)_0%,rgba(8,15,35,0.94)_100%)] shadow-[0_12px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm ${className}`}
    >
      {children}
    </section>
  );
};

export default Card;

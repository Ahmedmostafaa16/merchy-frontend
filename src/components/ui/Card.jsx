const Card = ({ className = "", children }) => {
  return (
    <section
      className={`rounded-[18px] border border-[#E5E7EB] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </section>
  );
};

export default Card;

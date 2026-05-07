const Card = ({ className = "", children }) => {
  return (
    <section
      className={`rounded-xl border border-[#E5E7EB] bg-white shadow-none ${className}`}
    >
      {children}
    </section>
  );
};

export default Card;

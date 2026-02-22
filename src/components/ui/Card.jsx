const Card = ({ className = "", children }) => {
  return (
    <section className={`rounded-2xl border border-zinc-200 bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
};

export default Card;

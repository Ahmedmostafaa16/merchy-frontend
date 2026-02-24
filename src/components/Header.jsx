import logo from "../assets/logo.png";

const Header = () => {
  return (
    <header className="h-16 w-full border-b border-[#1b2a52] bg-[#0a1228]/95 text-white backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1320px] items-center px-6">
        <div className="flex items-center">
          <img
            src={logo}
            alt="Merchy"
            className="h-32 w-auto object-contain"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;

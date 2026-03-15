const Header = ({ lastSyncLabel = "never" }) => {
  return (
    <div className="mt-3 text-sm text-zinc-400">
      Last Sync: {lastSyncLabel}
    </div>
  );
};

export default Header;

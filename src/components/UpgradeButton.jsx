import Button from "./ui/Button";

const BILLING_BASE_URL = "https://merchyapp-backend.up.railway.app";

const UpgradeButton = ({ shop, className = "" }) => {
  const handleUpgrade = () => {
    if (!shop) return;

    const url = `${BILLING_BASE_URL}/billing/subscribe/basic?shop=${encodeURIComponent(shop)}`;
    window.open(url, "_top");
  };

  return (
    <Button className={className} disabled={!shop} onClick={handleUpgrade}>
      Upgrade Plan
    </Button>
  );
};

export default UpgradeButton;

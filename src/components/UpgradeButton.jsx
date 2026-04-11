import Button from "./ui/Button";

const UpgradeButton = ({ shop, className = "" }) => {
  const handleUpgrade = () => {
    if (!shop) return;

    window.open(`https://${shop}/admin/apps/merchyy/pricing_plans`, "_top");
  };

  return (
    <Button className={className} disabled={!shop} onClick={handleUpgrade}>
      Upgrade to Basic - $20/month
    </Button>
  );
};

export default UpgradeButton;

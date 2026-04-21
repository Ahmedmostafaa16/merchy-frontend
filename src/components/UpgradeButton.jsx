import Button from "./ui/Button";
import { redirectToRemote } from "../shopify/appBridge";

const APP_HANDLE = "merchyy";

const UpgradeButton = ({ shop, className = "" }) => {
  const handleUpgrade = () => {
    if (!shop) return;

    const storeHandle = shop.replace(".myshopify.com", "");
    const url = `https://admin.shopify.com/store/${storeHandle}/charges/${APP_HANDLE}/pricing_plans`;

    redirectToRemote(url);
  };

  return (
    <Button className={className} disabled={!shop} onClick={handleUpgrade}>
      Upgrade to Basic - $20/month
    </Button>
  );
};

export default UpgradeButton;

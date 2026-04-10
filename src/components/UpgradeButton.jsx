import { useMemo, useState } from "react";
import { Redirect } from "@shopify/app-bridge/actions";
import Button from "./ui/Button";
import { authFetch } from "../lib/authFetch";
import { getAppBridge } from "../shopify/appBridge";

const UpgradeButton = ({ shop, className = "", onError }) => {
  const [loading, setLoading] = useState(false);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const host = params.get("host") || "";

  const handleUpgrade = async () => {
    if (!shop) return;

    setLoading(true);

    try {
      const redirectApp = getAppBridge();
      if (!redirectApp) {
        throw new Error("Unable to initialize Shopify App Bridge");
      }

      const redirect = Redirect.create(redirectApp);
      const query = new URLSearchParams({ plan: "basic" });
      if (host) {
        query.set("host", host);
      }

      const response = await authFetch(`/billing/create?${query.toString()}`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Billing request failed");
      }

      if (!payload?.confirmation_url) {
        throw new Error("Missing confirmation URL");
      }

      redirect.dispatch(Redirect.Action.REMOTE, payload.confirmation_url);
    } catch (error) {
      console.error("Billing error:", error);
      onError?.(error?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button className={className} disabled={!shop || loading} onClick={handleUpgrade}>
      {loading ? "Redirecting..." : "Upgrade Plan"}
    </Button>
  );
};

export default UpgradeButton;

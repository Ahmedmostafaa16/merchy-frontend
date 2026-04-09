import { useMemo, useState } from "react";
import Button from "./ui/Button";
import { apiClient } from "../lib/apiClient";

const UpgradeButton = ({ shop, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const host = params.get("host") || "";

  const handleUpgrade = async () => {
    if (!shop) return;

    setLoading(true);

    try {
      const payload = await apiClient.post("/billing/create", {
        query: {
          plan: "basic",
          host: host || undefined,
        },
      });

      if (!payload?.confirmation_url) {
        throw new Error("Missing confirmation URL");
      }

      window.open(payload.confirmation_url, "_top");
    } catch (error) {
      if (error?.status === 409) {
        window.location.assign(`${window.location.pathname}${window.location.search}`);
      }
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

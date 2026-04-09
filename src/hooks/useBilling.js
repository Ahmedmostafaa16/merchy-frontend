import { useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

const defaultBilling = {
  status: "INACTIVE",
  trial_ends_at: null,
  plan: null,
  has_access: false,
  in_trial: false,
  trial_days_left: 0,
  subscription_status: null,
};

export const useBilling = (shop) => {
  const [billing, setBilling] = useState(defaultBilling);
  const [loading, setLoading] = useState(Boolean(shop));

  useEffect(() => {
    let ignore = false;

    if (!shop) {
      setBilling(defaultBilling);
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    const loadBilling = async () => {
      setLoading(true);

      try {
        const payload = await apiClient.get("/billing/status");

        if (ignore) return;

        setBilling({
          status: payload?.status ?? "INACTIVE",
          trial_ends_at: payload?.trial_ends_at ?? null,
          plan: payload?.plan ?? null,
          has_access: Boolean(payload?.has_access),
          in_trial: Boolean(payload?.in_trial),
          trial_days_left: Number(payload?.trial_days_left || 0),
          subscription_status: payload?.subscription_status ?? null,
        });
      } catch (_error) {
        if (ignore) return;
        setBilling(defaultBilling);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadBilling();

    return () => {
      ignore = true;
    };
  }, [shop]);

  return { billing, loading };
};

export default useBilling;

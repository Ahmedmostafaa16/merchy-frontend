import { useEffect, useState } from "react";

const BILLING_BASE_URL = "https://merchyapp-backend.up.railway.app";

const defaultBilling = {
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
        const url = `${BILLING_BASE_URL}/billing/status?shop=${encodeURIComponent(shop)}`;
        const response = await fetch(url, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!response.ok) {
          throw new Error(`Billing status request failed with ${response.status}`);
        }

        const payload = await response.json();

        if (ignore) return;

        setBilling({
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

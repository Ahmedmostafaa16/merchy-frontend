import { useEffect, useState } from "react";
import { authFetch } from "../lib/authFetch";

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
        const response = await authFetch("/billing/status");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || payload?.detail || "Billing status request failed");
        }

        if (ignore) return;

        const trialEndsAt = payload?.trial_ends_at ?? null;
        const trialEndTime = trialEndsAt ? new Date(trialEndsAt).getTime() : NaN;
        const now = Date.now();
        const inTrial = Number.isFinite(trialEndTime) && trialEndTime > now;
        const trialDaysLeft = inTrial
          ? Math.max(1, Math.ceil((trialEndTime - now) / (1000 * 60 * 60 * 24)))
          : 0;

        setBilling({
          status: payload?.status ?? "INACTIVE",
          trial_ends_at: trialEndsAt,
          plan: payload?.plan ?? null,
          has_access: Boolean(payload?.has_access),
          in_trial: inTrial,
          trial_days_left: trialDaysLeft,
          subscription_status: payload?.status === "ACTIVE" ? "ACTIVE" : null,
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

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

const normalizeBilling = (payload) => {
  const trialEndsAt = payload?.trial_ends_at ?? null;
  const trialEndTime = trialEndsAt ? new Date(trialEndsAt).getTime() : NaN;
  const now = Date.now();
  const inTrial = Number.isFinite(trialEndTime) && trialEndTime > now;
  const trialDaysLeft = inTrial
    ? Math.max(1, Math.ceil((trialEndTime - now) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    status: payload?.status ?? "INACTIVE",
    trial_ends_at: trialEndsAt,
    plan: payload?.plan ?? null,
    has_access: Boolean(payload?.has_access),
    in_trial: inTrial,
    trial_days_left: trialDaysLeft,
    subscription_status: payload?.status === "ACTIVE" ? "ACTIVE" : null,
  };
};

export function useBilling(_shop) {
  const [billing, setBilling] = useState(defaultBilling);
  const [loading, setLoading] = useState(_shop !== "");

  useEffect(() => {
    let ignore = false;
    const enabled = _shop !== "";

    if (!enabled) {
      setBilling(defaultBilling);
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    const readStatus = async () => {
      const response = await authFetch("/billing/status");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Billing status request failed");
      }

      return payload;
    };

    const fetchBilling = async () => {
      setLoading(true);

      try {
        let payload = await readStatus();

        if (!payload?.has_access) {
          const syncResponse = await authFetch("/billing/sync");
          if (!syncResponse.ok) {
            const syncPayload = await syncResponse.json();
            throw new Error(syncPayload?.error || syncPayload?.detail || "Billing sync failed");
          }

          payload = await readStatus();
        }

        if (!ignore) {
          setBilling(normalizeBilling(payload));
        }
      } catch (err) {
        console.error("Billing error", err);
        if (!ignore) {
          setBilling(defaultBilling);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchBilling();

    return () => {
      ignore = true;
    };
  }, [_shop]);

  return { billing, loading };
}

export default useBilling;

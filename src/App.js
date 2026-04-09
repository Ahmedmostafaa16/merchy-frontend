import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Paywall from "./components/Paywall";
import UpgradeButton from "./components/UpgradeButton";
import { apiClient } from "./lib/apiClient";
import InstallSuccess from "./pages/InstallSuccess";
import MailNotifications from "./pages/MailNotifications";
import Overview from "./pages/Overview";
import POBuilder from "./pages/POBuilder";
import PurchaseOrders from "./pages/PurchaseOrders";
import RawData from "./pages/RawData";
import { getAppBridge } from "./shopify/appBridge";

const BACKEND_URL = "https://merchyapp-backend.up.railway.app";

function DefaultRedirect({ notifications }) {
  const location = useLocation();
  const target = notifications?.exists === false ? "/settings" : "/overview";
  return <Navigate to={`${target}${location.search}`} replace />;
}

function SettingsRedirect() {
  const location = useLocation();
  return <Navigate to={`/settings${location.search}`} replace />;
}

function ProtectedRoute({ notifications, children }) {
  const location = useLocation();

  if (notifications?.exists === false) {
    return <Navigate to={`/settings${location.search}`} replace />;
  }

  return children;
}

function BillingLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a1228] text-[#dbe4ff]">
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#6A329F]" />
        <p className="text-sm font-medium text-[#aab6d3]">Loading your store...</p>
      </div>
    </div>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const shop = params.get("shop");
  const host = params.get("host");
  const path = window.location.pathname;
  const dashboardRoute = ["/", "/dashboard", "/overview", "/raw-data", "/settings", "/mail-notifications", "/po", "/po/create"].includes(path)
    || path.startsWith("/po/");
  const [ready, setReady] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationsState, setNotificationsState] = useState({
    exists: null,
    email: null,
    threshold_days: null,
  });
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(true);

  useEffect(() => {
    console.log(window.location.href);
    console.log("Shop:", shop);
    console.log("Host:", host);

    if (host) {
      const app = getAppBridge();
      if (!app) {
        return;
      }
    }

    setReady(true);
  }, [dashboardRoute, host, shop]);

  useEffect(() => {
    if (!shop) {
      setBilling(null);
      setBillingLoading(false);
      return;
    }

    let ignore = false;

    fetch(`${BACKEND_URL}/auth/shops/${encodeURIComponent(shop)}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((response) => {
        if (!response.ok) {
          window.top.location.href = `${BACKEND_URL}/auth/install?shop=${encodeURIComponent(shop)}`;
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (!data) return null;

        if (data.installed === false) {
          window.top.location.href = `${BACKEND_URL}/auth/install?shop=${encodeURIComponent(shop)}`;
          return null;
        }

        return fetch(`${BACKEND_URL}/billing/status?shop=${encodeURIComponent(shop)}`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        })
          .then((response) => response.json())
          .then((billingPayload) => {
            if (ignore) return;
            setBilling(billingPayload);
            setBillingLoading(false);
          });
      })
      .catch(() => {
        if (ignore) return;
        setBillingLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [shop]);

  useEffect(() => {
    if (!ready || billingLoading || !billing?.has_access) {
      setNotificationsLoading(false);
      return;
    }

    let ignore = false;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      setNotificationsError("");

      try {
        const payload = await apiClient.get("/notifications");
        if (ignore) return;
        setNotificationsState({
          exists: Boolean(payload?.exists),
          email: payload?.email || null,
          threshold_days: payload?.threshold_days ?? null,
        });
      } catch (error) {
        if (ignore) return;
        setNotificationsState({
          exists: false,
          email: null,
          threshold_days: null,
        });
        if (error?.status >= 500) {
          setNotificationsError("Something went wrong. Please try again.");
        }
      } finally {
        if (!ignore) {
          setNotificationsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      ignore = true;
    };
  }, [ready, billingLoading, billing?.has_access]);

  useEffect(() => {
    setTrialBannerDismissed(false);
  }, [shop, billing?.in_trial, billing?.trial_days_left]);

  const handleNotificationsSaved = ({ email, threshold_days }) => {
    setNotificationsState({
      exists: true,
      email,
      threshold_days,
    });
  };

  if (dashboardRoute && (!shop || !host)) {
    return <div>Missing Shopify host</div>;
  }

  if (!ready || billingLoading || (billing?.has_access && notificationsLoading)) {
    return <BillingLoadingScreen />;
  }

  if (!billing?.has_access) {
    return <Paywall shop={shop} />;
  }

  return (
    <>
      {billing?.in_trial && !trialBannerDismissed ? (
        <div className="sticky top-0 z-50 border-b border-[#8f6a1f] bg-[#2c2412] px-4 py-3 text-[#f8e7b5] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 text-sm font-medium">
              {"\u26A0\uFE0F Trial ends in "}
              {billing.trial_days_left}
              {" days"}
            </div>
            <div className="flex items-center gap-3">
              <UpgradeButton shop={shop} className="h-10 px-5 sm:w-auto" />
              <button
                type="button"
                onClick={() => setTrialBannerDismissed(true)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#8f6a1f] px-4 text-sm font-semibold text-[#f8e7b5] transition hover:bg-white/5"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DefaultRedirect notifications={notificationsState} />} />
          <Route path="/dashboard" element={<DefaultRedirect notifications={notificationsState} />} />
          <Route
            path="/overview"
            element={(
              <ProtectedRoute notifications={notificationsState}>
                <Overview settingsEmail={notificationsState.email} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/raw-data"
            element={(
              <ProtectedRoute notifications={notificationsState}>
                <RawData settingsEmail={notificationsState.email} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/settings"
            element={(
              <MailNotifications
                notifications={notificationsState}
                notificationsError={notificationsError}
                onNotificationSaved={handleNotificationsSaved}
              />
            )}
          />
          <Route path="/mail-notifications" element={<SettingsRedirect />} />
          <Route
            path="/po"
            element={(
              <ProtectedRoute notifications={notificationsState}>
                <PurchaseOrders settingsEmail={notificationsState.email} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/po/create"
            element={(
              <ProtectedRoute notifications={notificationsState}>
                <POBuilder settingsEmail={notificationsState.email} />
              </ProtectedRoute>
            )}
          />
          <Route path="/install/success" element={<InstallSuccess />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

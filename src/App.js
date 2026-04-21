import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Paywall from "./components/Paywall";
import UpgradeButton from "./components/UpgradeButton";
import { apiClient } from "./lib/apiClient";
import useBilling from "./hooks/useBilling";
import InstallSuccess from "./pages/InstallSuccess";
import MailNotifications from "./pages/MailNotifications";
import Overview from "./pages/Overview";
import POBuilder from "./pages/POBuilder";
import PurchaseOrders from "./pages/PurchaseOrders";
import RawData from "./pages/RawData";
import { getAppBridge, getHostParam, getShopParam, redirectToRemote } from "./shopify/appBridge";
import { authFetch } from "./lib/authFetch";

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
  const shop = getShopParam();
  const host = getHostParam();
  const path = window.location.pathname;
  const installSuccessRoute = path === "/install/success";
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
  const [shopInstalled, setShopInstalled] = useState(false);
  const [installCheckLoading, setInstallCheckLoading] = useState(true);
  const [installCheckError, setInstallCheckError] = useState("");
  const [billingOverride, setBillingOverride] = useState(null);
  const { billing, loading: billingLoading } = useBilling(shopInstalled ? shop : "");
  const effectiveBilling = billingOverride || billing;

  useEffect(() => {
    if (host) {
      const app = getAppBridge();
      if (!app) {
        return;
      }
    }

    setReady(true);
  }, [dashboardRoute, host, shop]);

  useEffect(() => {
    if (installSuccessRoute) {
      setShopInstalled(false);
      setInstallCheckLoading(false);
      setInstallCheckError("");
      return;
    }

    if (!shop || !host) {
      setShopInstalled(false);
      setInstallCheckLoading(false);
      setInstallCheckError("");
      return;
    }

    let ignore = false;
    setInstallCheckLoading(true);
    setInstallCheckError("");
    setShopInstalled(false);
    setBillingOverride(null);

    authFetch(`/auth/shops/${encodeURIComponent(shop)}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((response) => {
        if (!response.ok) {
          const installParams = new URLSearchParams({ shop });
          if (host) {
            installParams.set("host", host);
          }
          redirectToRemote(`${BACKEND_URL}/auth/install?${installParams.toString()}`);
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (!data) return null;

        if (data.installed === false) {
          const installParams = new URLSearchParams({ shop });
          if (host) {
            installParams.set("host", host);
          }
          redirectToRemote(`${BACKEND_URL}/auth/install?${installParams.toString()}`);
          return null;
        }
        if (ignore) return null;
        setShopInstalled(true);
        setInstallCheckLoading(false);
        return null;
      })
      .catch(() => {
        if (ignore) return;
        setInstallCheckError("We could not verify the Shopify installation.");
        setInstallCheckLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [installSuccessRoute, host, shop]);

  useEffect(() => {
    const handleBillingRequired = (event) => {
      setTrialBannerDismissed(false);
      setBillingOverride({
        ...(billing || {}),
        ...(event?.detail || {}),
        status: "INACTIVE",
        has_access: false,
        in_trial: false,
      });
    };

    window.addEventListener("billing:required", handleBillingRequired);
    return () => {
      window.removeEventListener("billing:required", handleBillingRequired);
    };
  }, [billing]);

  useEffect(() => {
    if (billing?.has_access) {
      setBillingOverride(null);
    }
  }, [billing]);

  useEffect(() => {
    if (!ready || installCheckLoading || billingLoading || !effectiveBilling?.has_access) {
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
  }, [ready, installCheckLoading, billingLoading, effectiveBilling?.has_access, shop]);

  useEffect(() => {
    setTrialBannerDismissed(false);
  }, [shop, effectiveBilling?.in_trial, effectiveBilling?.trial_days_left]);

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

  if (installSuccessRoute) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/install/success" element={<InstallSuccess />} />
        </Routes>
      </BrowserRouter>
    );
  }

  if (installCheckError) {
    return <div>{installCheckError}</div>;
  }

  if (!ready || installCheckLoading || billingLoading || (effectiveBilling?.has_access && notificationsLoading)) {
    return <BillingLoadingScreen />;
  }

  if (!effectiveBilling?.has_access) {
    return <Paywall shop={shop} />;
  }

  return (
    <>
      {effectiveBilling?.in_trial && !trialBannerDismissed ? (
        <div className="sticky top-0 z-50 border-b border-[#8f6a1f] bg-[#2c2412] px-4 py-3 text-[#f8e7b5] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 text-sm font-medium">
              {"\u26A0\uFE0F Trial ends in "}
              {effectiveBilling.trial_days_left}
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

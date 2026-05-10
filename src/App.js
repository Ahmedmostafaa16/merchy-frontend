import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Paywall from "./components/Paywall";
import UpgradeButton from "./components/UpgradeButton";
import { apiClient } from "./lib/apiClient";
import useBilling from "./hooks/useBilling";
import InstallSuccess from "./pages/InstallSuccess";
import MailNotifications from "./pages/MailNotifications";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import POBuilder from "./pages/POBuilder";
import POEdit from "./pages/POEdit";
import POView from "./pages/POView";
import PurchaseOrders from "./pages/PurchaseOrders";
import RawData from "./pages/RawData";
import { getAppBridge, getHostParam, getShopParam, redirectToRemote } from "./shopify/appBridge";
import { authFetch } from "./lib/authFetch";

const BACKEND_URL = "https://merchyapp-backend.up.railway.app";

function DefaultRedirect({ notifications, locationPreferences }) {
  const location = useLocation();
  const target = notifications?.exists === false || locationPreferences?.exists === false ? "/settings" : "/overview";
  return <Navigate to={`${target}${location.search}`} replace />;
}

function SettingsRedirect() {
  const location = useLocation();
  return <Navigate to={`/settings${location.search}`} replace />;
}

function RawDataRedirect() {
  const location = useLocation();
  return <Navigate to={`/replenish${location.search}`} replace />;
}

function ProtectedRoute({ notifications, locationPreferences, children }) {
  const location = useLocation();

  if (notifications?.exists === false || locationPreferences?.exists === false) {
    return <Navigate to={`/settings${location.search}`} replace />;
  }

  return children;
}

function BillingLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#DBEAFE] border-t-[#2563EB]" />
        </div>
        <p className="text-sm font-semibold text-[#6B7280]">Loading your store...</p>
      </div>
    </div>
  );
}

function App() {
  const shop = getShopParam();
  const host = getHostParam();
  const path = window.location.pathname;
  const installSuccessRoute = path === "/install/success";
  const dashboardRoute = ["/", "/dashboard", "/overview", "/raw-data", "/replenish", "/settings", "/mail-notifications", "/po", "/po/create"].includes(path)
    || path.startsWith("/po/");
  const [ready, setReady] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationsState, setNotificationsState] = useState({
    exists: null,
    email: null,
    threshold_days: null,
  });
  const [locationPreferencesLoading, setLocationPreferencesLoading] = useState(true);
  const [locationPreferencesError, setLocationPreferencesError] = useState("");
  const [locationPreferencesState, setLocationPreferencesState] = useState({
    exists: null,
    location_ids: [],
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
    if (!ready || installCheckLoading || billingLoading || !effectiveBilling?.has_access) {
      setLocationPreferencesLoading(false);
      return;
    }

    let ignore = false;

    const loadLocationPreferences = async () => {
      setLocationPreferencesLoading(true);
      setLocationPreferencesError("");

      try {
        const payload = await apiClient.get("/locations/preferences");
        if (ignore) return;
        const locationIds = Array.isArray(payload?.location_ids) ? payload.location_ids : [];
        setLocationPreferencesState({
          exists: locationIds.length > 0,
          location_ids: locationIds,
        });
      } catch (error) {
        if (ignore) return;
        setLocationPreferencesState({
          exists: false,
          location_ids: [],
        });
        setLocationPreferencesError(
          error?.status >= 500
            ? "Something went wrong. Please try again."
            : (error?.message || "Unable to load inventory locations.")
        );
      } finally {
        if (!ignore) {
          setLocationPreferencesLoading(false);
        }
      }
    };

    loadLocationPreferences();

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

  const handleLocationPreferencesSaved = (locationIds) => {
    setLocationPreferencesState({
      exists: Array.isArray(locationIds) && locationIds.length > 0,
      location_ids: Array.isArray(locationIds) ? locationIds : [],
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

  if (
    !ready ||
    installCheckLoading ||
    billingLoading ||
    (effectiveBilling?.has_access && (notificationsLoading || locationPreferencesLoading))
  ) {
    return <BillingLoadingScreen />;
  }

  if (!effectiveBilling?.has_access) {
    return <Paywall shop={shop} />;
  }

  return (
    <>
      {effectiveBilling?.in_trial && !trialBannerDismissed ? (
        <div className="sticky top-0 z-50 border-b border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[#92400E] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
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
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#FCD34D] bg-white px-4 text-sm font-semibold text-[#92400E] transition hover:bg-[#FEF3C7]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DefaultRedirect notifications={notificationsState} locationPreferences={locationPreferencesState} />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute notifications={notificationsState} locationPreferences={locationPreferencesState}>
                <Dashboard page="dashboard" settingsEmail={notificationsState.email} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/overview"
            element={(
              <ProtectedRoute notifications={notificationsState} locationPreferences={locationPreferencesState}>
                <Overview settingsEmail={notificationsState.email} />
              </ProtectedRoute>
            )}
          />
          <Route path="/raw-data" element={<RawDataRedirect />} />
          <Route
            path="/replenish"
            element={(
              <ProtectedRoute notifications={notificationsState} locationPreferences={locationPreferencesState}>
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
                locationPreferences={locationPreferencesState}
                locationPreferencesError={locationPreferencesError}
                onNotificationSaved={handleNotificationsSaved}
                onLocationPreferencesSaved={handleLocationPreferencesSaved}
              />
            )}
          />
          <Route path="/mail-notifications" element={<SettingsRedirect />} />
          <Route
            path="/po"
            element={(
              <ProtectedRoute notifications={notificationsState} locationPreferences={locationPreferencesState}>
                <PurchaseOrders settingsEmail={notificationsState.email} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/po/create"
            element={(
              <ProtectedRoute notifications={notificationsState} locationPreferences={locationPreferencesState}>
                <POBuilder settingsEmail={notificationsState.email} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/po/:poId"
            element={(
              <ProtectedRoute notifications={notificationsState} locationPreferences={locationPreferencesState}>
                <POView settingsEmail={notificationsState.email} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/po/:poId/edit"
            element={(
              <ProtectedRoute notifications={notificationsState} locationPreferences={locationPreferencesState}>
                <POEdit settingsEmail={notificationsState.email} />
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

import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import InstallSuccess from "./pages/InstallSuccess";
import MailNotifications from "./pages/MailNotifications";
import Overview from "./pages/Overview";
import POBuilder from "./pages/POBuilder";
import PurchaseOrders from "./pages/PurchaseOrders";
import RawData from "./pages/RawData";
import { API_BASE } from "./config/api";
import { apiClient } from "./lib/apiClient";
import { getAppBridge } from "./shopify/appBridge";

function DefaultRedirect({ notifications }) {
  const location = useLocation();
  const target = notifications?.exists === false ? "/settings" : "/overview";
  return <Navigate to={`${target}${location.search}`} replace />;
}

function ProtectedRoute({ notifications, children }) {
  const location = useLocation();

  if (notifications?.exists === false) {
    return <Navigate to={`/settings${location.search}`} replace />;
  }

  return children;
}

function App() {
  const [ready, setReady] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationsState, setNotificationsState] = useState({
    exists: null,
    email: null,
    threshold_days: null,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get("host");
    const shop = params.get("shop");
    const path = window.location.pathname;
    const dashboardRoute = ["/", "/dashboard", "/overview", "/raw-data", "/settings", "/mail-notifications", "/po", "/po/create"].includes(path)
      || path.startsWith("/po/");

    if (dashboardRoute && !host && shop) {
      window.location.href = `${API_BASE}/auth/install?shop=${encodeURIComponent(shop)}`;
      return;
    }

    if (host) {
      getAppBridge();
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

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
  }, [ready]);

  const handleNotificationsSaved = ({ email, threshold_days }) => {
    setNotificationsState({
      exists: true,
      email,
      threshold_days,
    });
  };

  if (!ready || notificationsLoading) return null;

  return (
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
        <Route path="/mail-notifications" element={<Navigate to="/settings" replace />} />
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
  );
}

export default App;

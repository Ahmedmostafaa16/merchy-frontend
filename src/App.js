import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import InstallSuccess from "./pages/InstallSuccess";
import MailNotifications from "./pages/MailNotifications";
import Overview from "./pages/Overview";
import POBuilder from "./pages/POBuilder";
import RawData from "./pages/RawData";
import { API_BASE } from "./config/api";
import { getAppBridge } from "./shopify/appBridge";

function RedirectWithSearch({ to }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
}

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get("host");
    const shop = params.get("shop");
    const path = window.location.pathname;
    const dashboardRoute = ["/", "/dashboard", "/overview", "/raw-data", "/mail-notifications", "/po/create"].includes(path);

    if (dashboardRoute && !host && shop) {
      window.location.href = `${API_BASE}/auth/install?shop=${encodeURIComponent(shop)}`;
      return;
    }

    if (host) {
      getAppBridge();
    }

    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectWithSearch to="/overview" />} />
        <Route path="/dashboard" element={<RedirectWithSearch to="/overview" />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/raw-data" element={<RawData />} />
        <Route path="/mail-notifications" element={<MailNotifications />} />
        <Route path="/po/create" element={<POBuilder />} />
        <Route path="/install/success" element={<InstallSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

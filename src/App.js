import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import InstallSuccess from "./pages/InstallSuccess";
import { API_BASE } from "./config/api";

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get("host");
    const shop = params.get("shop");
    const path = window.location.pathname;
    const dashboardRoute = path === "/" || path === "/dashboard";

    if (dashboardRoute && !host && shop) {
      window.location.href = `${API_BASE}/auth/install?shop=${encodeURIComponent(shop)}`;
      return;
    }

    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/install/success" element={<InstallSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import { fetchWithToken } from "../lib/authFetch";

const AppLoader = () => {
  const navigate = useNavigate();
  const hasRunRef = useRef(false);
  const [message, setMessage] = useState("Checking store installation...");

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");

      if (!shop) {
        setMessage("Missing shop parameter");
        return;
      }

      try {
        const response = await fetchWithToken(
          `${API_BASE}/auth/shops/${encodeURIComponent(shop)}`,
          {
            headers: { "ngrok-skip-browser-warning": "true" },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            window.top.location.href = `${API_BASE}/auth/install?shop=${encodeURIComponent(shop)}`;
            return;
          }
          setMessage("Unable to verify installation");
          return;
        }

        const data = await response.json();

        if (data?.installed === true) {
          navigate(`/dashboard${window.location.search}`, { replace: true });
          return;
        }

        setMessage("Store is not installed");
      } catch (_error) {
        setMessage("Unable to verify installation");
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1228] text-[#dbe4ff]">
      <p className="text-base font-medium">{message}</p>
    </div>
  );
};

export default AppLoader;

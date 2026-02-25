import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

const AppLoader = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Checking store installation...");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");

      if (!shop) {
        setMessage("Missing shop parameter");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/auth/shops/${encodeURIComponent(shop)}`,
          {
            headers: { "ngrok-skip-browser-warning": "true" },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            window.location.href = `${API_BASE}/auth/install?shop=${encodeURIComponent(shop)}`;
            return;
          }
          setMessage("Unable to verify installation");
          return;
        }

        const data = await response.json();

        if (data?.installed === true) {
          navigate(`/dashboard?shop=${encodeURIComponent(shop)}`, { replace: true });
          return;
        }

        window.location.href = `${API_BASE}/auth/install?shop=${encodeURIComponent(shop)}`;
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

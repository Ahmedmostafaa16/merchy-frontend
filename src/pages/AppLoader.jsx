import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import { shopifyFetch } from "../api";
import { getShopifyParams } from "../shopify";

const AppLoader = () => {
  const navigate = useNavigate();
  const hasRunRef = useRef(false);
  const [message, setMessage] = useState("Checking store installation...");

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const run = async () => {
      const { shop, host } = getShopifyParams();

      if (!shop) {
        setMessage("Missing shop parameter");
        return;
      }

      try {
        const data = await shopifyFetch("/api/me");

        if (!data?.shop) {
          const installUrl = `${API_BASE}/auth/install?shop=${encodeURIComponent(shop)}`;
          window.top.location.href = installUrl;
          return;
        }

        const query = new URLSearchParams();
        query.set("shop", shop);
        if (host) query.set("host", host);

        navigate(`/dashboard?${query.toString()}`, { replace: true });
      } catch (error) {
        const statusMatch = error?.message?.match(/Backend error\s(\d+)/);
        const statusCode = statusMatch ? Number(statusMatch[1]) : undefined;

        if (statusCode === 401 || statusCode === 404) {
          const installUrl = `${API_BASE}/auth/install?shop=${encodeURIComponent(shop)}`;
          window.top.location.href = installUrl;
          return;
        }

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

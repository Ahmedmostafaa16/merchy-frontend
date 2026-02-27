import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const resolveApiBase = () => {
  const craBase = process.env.REACT_APP_API_BASE_URL || "";
  let viteBase = "";

  try {
    viteBase = import.meta?.env?.VITE_API_BASE || "";
  } catch (_error) {
    viteBase = "";
  }

  return (viteBase || craBase || "").replace(/\/$/, "");
};

const InstallSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [shop, setShop] = useState("");
  const [redirectShop, setRedirectShop] = useState("");
  const [error, setError] = useState("");

  const verifyShop = async () => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get("shop") || "";

    setShop(shopParam);
    setRedirectShop(shopParam);
    setError("");
    setStatus("loading");

    if (!shopParam) {
      setStatus("error");
      setError("Missing shop parameter.");
      return;
    }

    const apiBase = resolveApiBase();

    if (!apiBase) {
      setStatus("error");
      setError("Missing API base URL in environment.");
      return;
    }

    try {
      const url = `${apiBase}/auth/shops/${encodeURIComponent(shopParam)}`;

      const response = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      const text = await response.text();
      const looksLikeHtml = /<\s*!doctype\s+html|<\s*html/i.test(text);

      if (looksLikeHtml) {
        setStatus("error");
        setError("Wrong API base or route (expected JSON)");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        setError(`Backend returned ${response.status}: ${text}`);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (_error) {
        setStatus("error");
        setError("Wrong API base or route (expected JSON)");
        return;
      }

      if (data && data.shop && data.installed === true) {
        setShop(data.shop);
        setStatus("success");
        return;
      }

      setStatus("error");
      setError("Invalid response from backend.");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Network error while verifying installation.");
    }
  };

  useEffect(() => {
    verifyShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "success") {
      navigate(`/dashboard?shop=${encodeURIComponent(redirectShop)}`);
    }
    return undefined;
  }, [status, redirectShop, navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <span className="card-kicker">Shopify App</span>
          <h2>Installation</h2>
          <p>We are verifying your store connection.</p>
        </div>

        <div className="dynamic-content">
          {status === "loading" && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Connecting to your Shopify store...</p>
            </div>
          )}

          {status === "error" && (
            <div className="error-state">
              <div className="error-message">
                Could not verify store installation
                {error ? <div style={{ marginTop: 8, fontSize: 14 }}>{error}</div> : null}
              </div>
              <button className="submit-button" type="button" onClick={verifyShop}>
                Retry
              </button>
            </div>
          )}

          {status === "success" && (
            <div className="success-state">
              <div className="success-message">
                <h3>Store connected successfully</h3>
                <p>{shop}</p>
              </div>
              <button
                className="submit-button"
                type="button"
                onClick={() => navigate(`/dashboard?shop=${encodeURIComponent(redirectShop)}`)}
              >
                Enter Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallSuccess;

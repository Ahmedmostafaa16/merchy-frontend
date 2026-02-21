import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
console.log("API_BASE_URL:", API_BASE_URL);

const InstallSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [shop, setShop] = useState("");
  const [error, setError] = useState("");

  const verifyShop = async () => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get("shop") || "";

    setShop(shopParam);
    setError("");
    setStatus("loading");

    if (!shopParam) {
      setStatus("error");
      setError("Missing shop parameter.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/shops/${encodeURIComponent(shopParam)}`
      );

      if (!response.ok) {
        setStatus("error");
        setError(`Backend returned ${response.status}. Could not verify installation.`);
        return;
      }

      const data = await response.json();

      if (data && data.shop) {
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
    if (status !== "success") return undefined;

    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [status, navigate]);

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
                onClick={() => navigate("/dashboard")}
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
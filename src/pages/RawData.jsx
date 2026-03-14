import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import { apiClient, getApiBase } from "../lib/apiClient";
import { fetchWithToken } from "../lib/authFetch";

const RawData = () => {
  const [rows, setRows] = useState(() => {
    try {
      const savedRows = window.sessionStorage.getItem("merchy_forecast_rows");
      return savedRows ? JSON.parse(savedRows) : [];
    } catch (_error) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRawTable = async () => {
      const savedRequest = window.sessionStorage.getItem("merchy_forecast_request");
      if (!savedRequest || !getApiBase()) return;

      let requestConfig;
      try {
        requestConfig = JSON.parse(savedRequest);
      } catch (_error) {
        return;
      }

      if (!requestConfig?.shop_domain || !requestConfig?.number_of_days || !requestConfig?.minimum_value) {
        return;
      }

      setLoading(true);

      try {
        let payload = [];

        if (requestConfig.scope === "custom") {
          const params = new URLSearchParams({
            shop_domain: requestConfig.shop_domain,
            number_of_days: String(requestConfig.number_of_days),
            minimum_value: String(requestConfig.minimum_value),
          });
          (requestConfig.items || []).forEach((item) => params.append("items", item));

          const base = getApiBase();
          const response = await fetchWithToken(`${base}/requests/customized/report?${params.toString()}`, {
            method: "POST",
            headers: { "ngrok-skip-browser-warning": "true" },
          });

          if (response.ok) {
            payload = await response.json();
          }
        } else {
          payload = await apiClient.post("/requests/report", {
            query: {
              shop_domain: requestConfig.shop_domain,
              number_of_days: requestConfig.number_of_days,
              minimum_value: requestConfig.minimum_value,
            },
          });
        }

        const normalizedRows = Array.isArray(payload) ? payload : [];
        setRows(normalizedRows);
        window.sessionStorage.setItem("merchy_forecast_rows", JSON.stringify(normalizedRows));
      } catch (_error) {
        // Keep the last cached rows if refetch fails.
      } finally {
        setLoading(false);
      }
    };

    loadRawTable();
  }, []);

  return <Dashboard page="raw-data" initialForecastData={rows} rawDataLoading={loading} />;
};

export default RawData;

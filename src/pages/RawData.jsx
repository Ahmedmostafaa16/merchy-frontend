import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";

const RawData = ({ settingsEmail = "" }) => {
  const [rows, setRows] = useState(() => {
    try {
      const savedRows = window.localStorage.getItem("forecast_cache");
      return savedRows ? JSON.parse(savedRows) : [];
    } catch (_error) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const savedRows = window.localStorage.getItem("forecast_cache");
      if (!savedRows) return;
      setLoading(true);
      setRows(JSON.parse(savedRows));
    } catch (_error) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return <Dashboard page="raw-data" initialForecastData={rows} rawDataLoading={loading} settingsEmail={settingsEmail} />;
};

export default RawData;

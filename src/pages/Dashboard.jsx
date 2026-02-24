import { useCallback, useEffect, useState } from "react";
import Header from "../components/Header";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import KPIStatCard from "../components/ui/KPIStatCard";
import PillChip from "../components/ui/PillChip";
import Tabs from "../components/ui/Tabs";
import Skeleton from "../components/ui/Skeleton";
import "../styles/dashboard.css";

const salesPeriods = ["Yesterday", "Last 7 days", "Last 30 days", "Last 90 days", "Last 365 days"];
const tabs = ["Restock Suggestions", "Item Breakdown", "Raw Table"];
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const INVENTORY_SYNC_ENDPOINT = "/sync/inventory";
const SALES_SYNC_ENDPOINT = "/sync/sales";
const FORECAST_ENDPOINT = "/report";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [shop, setShop] = useState("");
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [kpiError, setKpiError] = useState("");
  const [totalSkus, setTotalSkus] = useState(null);
  const [avgSalesPerDay, setAvgSalesPerDay] = useState(null);
  const [coverageDays, setCoverageDays] = useState(null);
  const [stockRisk, setStockRisk] = useState(null);
  const [activePeriod, setActivePeriod] = useState("Yesterday");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [forecastScope, setForecastScope] = useState("all");
  const [inventorySyncing, setInventorySyncing] = useState(false);
  const [salesSyncing, setSalesSyncing] = useState(false);
  const [forecastGenerating, setForecastGenerating] = useState(false);
  const [inventoryMessage, setInventoryMessage] = useState("");
  const [salesMessage, setSalesMessage] = useState("");
  const [forecastMessage, setForecastMessage] = useState("");

  const extractMetricValue = useCallback((payload) => {
    if (payload === null || payload === undefined) return null;
    if (typeof payload === "number" || typeof payload === "string") return payload;
    if (typeof payload === "object") {
      const [firstValue] = Object.values(payload);
      return firstValue ?? null;
    }
    return null;
  }, []);

  const toIsoDate = useCallback((date) => {
    return date.toISOString().slice(0, 10);
  }, []);

  const getRangeFromPeriod = useCallback((period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return {
        start: toIsoDate(yesterday),
        end: toIsoDate(yesterday),
      };
    }

    const daysMap = {
      "Last 7 days": 7,
      "Last 30 days": 30,
      "Last 90 days": 90,
      "Last 365 days": 365,
    };

    const days = daysMap[period] || 7;
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));

    return {
      start: toIsoDate(start),
      end: toIsoDate(today),
    };
  }, [toIsoDate]);

  const apiGetJson = useCallback(async (url) => {
    const response = await fetch(url, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    return response.json();
  }, []);

  const fetchDashboardMetrics = useCallback(async (shop) => {
    if (!shop) {
      setLoadingKpis(false);
      setKpiError("Missing shop parameter.");
      return;
    }

    if (!API_BASE_URL) {
      setLoadingKpis(false);
      setKpiError("Missing API base URL.");
      return;
    }

    setLoadingKpis(true);
    setKpiError("");

    try {
      const encodedShop = encodeURIComponent(shop);
      const base = `${API_BASE_URL}/dashboard`;

      const [totalSkusData, avgSalesData, coverageData, stockRiskData] = await Promise.all([
        apiGetJson(`${base}/total-skus?shop_domain=${encodedShop}`),
        apiGetJson(`${base}/average-sales-per-day?shop_domain=${encodedShop}`),
        apiGetJson(`${base}/coverage-days?shop_domain=${encodedShop}`),
        apiGetJson(`${base}/stock-risk?shop_domain=${encodedShop}`),
      ]);

      setTotalSkus(extractMetricValue(totalSkusData));
      setAvgSalesPerDay(extractMetricValue(avgSalesData));
      setCoverageDays(extractMetricValue(coverageData));
      setStockRisk(extractMetricValue(stockRiskData));
    } catch (error) {
      setKpiError(error?.message || "Unable to load metrics.");
    } finally {
      setLoadingKpis(false);
    }
  }, [apiGetJson, extractMetricValue]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get("shop") || "";
    setShop(shopParam);

    const initialRange = getRangeFromPeriod("Yesterday");
    setStartDate(initialRange.start);
    setEndDate(initialRange.end);
  }, [getRangeFromPeriod]);

  useEffect(() => {
    fetchDashboardMetrics(shop);
  }, [shop, fetchDashboardMetrics]);

  const handlePresetPeriodClick = (period) => {
    setActivePeriod(period);
    const range = getRangeFromPeriod(period);
    setStartDate(range.start);
    setEndDate(range.end);
    setSalesMessage("");
  };

  const handleSyncInventory = async () => {
    if (!shop || !API_BASE_URL) return;
    setInventorySyncing(true);
    setInventoryMessage("");
    try {
      const url = `${API_BASE_URL}${INVENTORY_SYNC_ENDPOINT}/${encodeURIComponent(shop)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!response.ok) throw new Error(`Inventory sync failed (${response.status})`);
      setInventoryMessage("Inventory synced.");
      await fetchDashboardMetrics(shop);
    } catch (error) {
      setInventoryMessage(error?.message || "Inventory sync failed.");
    } finally {
      setInventorySyncing(false);
    }
  };

  const handleSyncSales = async () => {
    if (!shop || !API_BASE_URL || !startDate || !endDate) return;
    setSalesSyncing(true);
    setSalesMessage("");
    try {
      const query = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      }).toString();
      const url = `${API_BASE_URL}${SALES_SYNC_ENDPOINT}/${encodeURIComponent(shop)}?${query}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!response.ok) throw new Error(`Sales sync failed (${response.status})`);
      setSalesMessage("Sales synced.");
      await fetchDashboardMetrics(shop);
    } catch (error) {
      setSalesMessage(error?.message || "Sales sync failed.");
    } finally {
      setSalesSyncing(false);
    }
  };

  const handleGenerateForecast = async () => {
    if (!shop || !API_BASE_URL || !startDate || !endDate) return;
    setForecastGenerating(true);
    setForecastMessage("");
    try {
      const query = new URLSearchParams({
        shop_domain: shop,
        forecast_scope: forecastScope,
        start_date: startDate,
        end_date: endDate,
      }).toString();
      const url = `${API_BASE_URL}${FORECAST_ENDPOINT}?${query}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (!response.ok) throw new Error(`Forecast generation failed (${response.status})`);
      setForecastMessage("Forecast generated.");
      await fetchDashboardMetrics(shop);
    } catch (error) {
      setForecastMessage(error?.message || "Forecast generation failed.");
    } finally {
      setForecastGenerating(false);
    }
  };

  const renderKpiValue = (value) => {
    if (loadingKpis) return <Skeleton className="mt-3 h-7 w-24" />;
    if (kpiError) return <p className="kpi-fallback mt-3">Unavailable</p>;
    return <p className="kpi-value mt-3">{value ?? "-"}</p>;
  };

  return (
    <div className="dashboard-page min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5">
            <Card className="dashboard-panel p-6">
              <h2 className="panel-title">Inventory Sync</h2>
              <p className="panel-text mt-2">
                Status: <span className="panel-text-strong">Not Synced</span>
              </p>
              <Button
                className="mt-7"
                disabled={inventorySyncing || !shop}
                onClick={inventorySyncing || !shop ? undefined : handleSyncInventory}
              >
                {inventorySyncing ? "Syncing..." : "Sync Inventory"}
              </Button>
              {inventoryMessage ? <p className="panel-message mt-3">{inventoryMessage}</p> : null}
            </Card>

            <Card className="dashboard-panel p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="panel-title">Sales Period</h2>
                <p className="panel-note">Sync inventory to proceed</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {salesPeriods.map((period) => (
                  <PillChip
                    key={period}
                    active={activePeriod === period}
                    onClick={() => handlePresetPeriodClick(period)}
                  >
                    {period}
                  </PillChip>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setActivePeriod("");
                      setStartDate(event.target.value);
                      setSalesMessage("");
                    }}
                    className="dashboard-input h-11 w-full rounded-xl px-3"
                  />
                </div>
                <div>
                  <label className="field-label mb-2 block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => {
                      setActivePeriod("");
                      setEndDate(event.target.value);
                      setSalesMessage("");
                    }}
                    className="dashboard-input h-11 w-full rounded-xl px-3"
                  />
                </div>
              </div>

              <div className="panel-meta mt-5 flex items-center justify-between">
                <p>
                  Selected range: <span className="panel-meta-value">{startDate && endDate ? `${startDate} to ${endDate}` : "None"}</span>
                </p>
                <p>
                  Status: <span className="panel-meta-value">Not Synced</span>
                </p>
              </div>

              <Button
                variant="secondary"
                className="mt-3"
                disabled={!startDate || !endDate}
                onClick={!startDate || !endDate ? undefined : () => setSalesMessage("Date range applied.")}
              >
                Apply
              </Button>
              <Button
                className="mt-2"
                disabled={salesSyncing || !shop || !startDate || !endDate}
                onClick={salesSyncing || !shop || !startDate || !endDate ? undefined : handleSyncSales}
              >
                {salesSyncing ? "Syncing..." : "Sync Sales"}
              </Button>
              {salesMessage ? <p className="panel-message mt-3">{salesMessage}</p> : null}
            </Card>

            <Card className="dashboard-panel p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="panel-title">Forecast Scope</h2>
                <p className="panel-note">Sync inventory to proceed</p>
              </div>

              <div className="mt-7 space-y-4">
                <label className="scope-option flex items-center gap-3">
                  <input
                    type="radio"
                    name="scope"
                    className="scope-radio h-5 w-5"
                    checked={forecastScope === "all"}
                    onChange={() => setForecastScope("all")}
                  />
                  Forecast all items
                </label>
                <label className="scope-option flex items-center gap-3">
                  <input
                    type="radio"
                    name="scope"
                    className="scope-radio h-5 w-5"
                    checked={forecastScope === "specific"}
                    onChange={() => setForecastScope("specific")}
                  />
                  Select specific items
                </label>
              </div>
            </Card>

            <Card className="dashboard-panel p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="panel-title">Generate</h2>
                <p className="panel-note">Sync inventory to proceed</p>
              </div>

              <Button
                className="mt-7"
                disabled={forecastGenerating || !shop || !startDate || !endDate}
                onClick={
                  forecastGenerating || !shop || !startDate || !endDate ? undefined : handleGenerateForecast
                }
              >
                {forecastGenerating ? "Generating..." : "Generate Forecast"}
              </Button>
              <Button variant="disabled" className="mt-3" disabled>
                Generate CSV
              </Button>
              {forecastMessage ? <p className="panel-message mt-3">{forecastMessage}</p> : null}
            </Card>
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {loadingKpis ? (
                <>
                  <KPIStatCard label="Total SKUs" />
                  <KPIStatCard label="Avg Sales / day" />
                  <KPIStatCard label="Stock Risk" />
                  <KPIStatCard label="Coverage days" />
                </>
              ) : (
                <>
                  <Card className="dashboard-panel p-4">
                    <p className="kpi-label">Total SKUs</p>
                    {renderKpiValue(totalSkus)}
                  </Card>
                  <Card className="dashboard-panel p-4">
                    <p className="kpi-label">Avg Sales / day</p>
                    {renderKpiValue(avgSalesPerDay)}
                  </Card>
                  <Card className="dashboard-panel p-4">
                    <p className="kpi-label">Stock Risk</p>
                    {renderKpiValue(stockRisk)}
                  </Card>
                  <Card className="dashboard-panel p-4">
                    <p className="kpi-label">Coverage days</p>
                    {renderKpiValue(coverageDays)}
                  </Card>
                </>
              )}
            </div>

            <Card className="dashboard-panel p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="panel-title">
                  Forecast vs Inventory Coverage (Coming soon)
                </h3>
                <p className="panel-note">Chart placeholder</p>
              </div>
              <div className="chart-placeholder relative h-[330px] rounded-2xl">
                <div className="chart-accent absolute left-6 right-6 top-1/2 h-0.5 -translate-y-1/2 rounded-full" />
              </div>
            </Card>

            <Card className="dashboard-panel p-6">
              <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
              <p className="panel-text mt-6">
                Run a forecast to see restock suggestions.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

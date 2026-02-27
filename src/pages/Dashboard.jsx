import { useCallback, useEffect, useState } from "react";
import Header from "../components/Header";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import KPIStatCard from "../components/ui/KPIStatCard";
import PillChip from "../components/ui/PillChip";
import Tabs from "../components/ui/Tabs";
import Skeleton from "../components/ui/Skeleton";
import { syncInventory, syncSales } from "../services/requestsApi";
import { apiClient, getApiBase } from "../lib/apiClient";
import "../styles/dashboard.css";

const salesPeriods = ["Yesterday", "Last 7 days", "Last 30 days", "Last 90 days", "Last 365 days"];
const tabs = ["Restock Suggestions", "Item Breakdown", "Raw Table"];

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
  const [globalError, setGlobalError] = useState("");
  const [showRetry, setShowRetry] = useState(false);
  const [retryAction, setRetryAction] = useState(null);

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

  const handleApiError = useCallback((error, fallbackMessage, onRetry) => {
    if (error?.status === 401) {
      setGlobalError("Session expired, reload app");
      setShowRetry(false);
      setRetryAction(null);
      return;
    }

    if (error?.status >= 500) {
      setGlobalError("Something went wrong. Please try again.");
      setShowRetry(false);
      setRetryAction(null);
      return;
    }

    if (error?.isNetwork) {
      setGlobalError("Network failure. Please retry.");
      setShowRetry(Boolean(onRetry));
      setRetryAction(() => onRetry || null);
      return;
    }

    setGlobalError(error?.message || fallbackMessage);
    setShowRetry(false);
    setRetryAction(null);
  }, []);

  const clearGlobalError = useCallback(() => {
    setGlobalError("");
    setShowRetry(false);
    setRetryAction(null);
  }, []);

  const fetchDashboardMetrics = useCallback(async (shopDomain) => {
    if (!shopDomain) {
      setLoadingKpis(false);
      setKpiError("Missing shop parameter.");
      return;
    }

    if (!getApiBase()) {
      setLoadingKpis(false);
      setKpiError("Missing API base URL.");
      return;
    }

    setLoadingKpis(true);
    setKpiError("");

    try {
      const query = { shop_domain: shopDomain };

      const [totalSkusData, avgSalesData, coverageData, stockRiskData] = await Promise.all([
        apiClient.get("/dashboard/total-skus", { query }),
        apiClient.get("/dashboard/average-sales-per-day", { query }),
        apiClient.get("/dashboard/coverage-days", { query }),
        apiClient.get("/dashboard/stock-risk", { query }),
      ]);

      setTotalSkus(extractMetricValue(totalSkusData));
      setAvgSalesPerDay(extractMetricValue(avgSalesData));
      setCoverageDays(extractMetricValue(coverageData));
      setStockRisk(extractMetricValue(stockRiskData));
      clearGlobalError();
    } catch (error) {
      setKpiError(error?.message || "Unable to load metrics.");
      handleApiError(error, "Unable to load metrics.", () => fetchDashboardMetrics(shopDomain));
    } finally {
      setLoadingKpis(false);
    }
  }, [clearGlobalError, extractMetricValue, handleApiError]);

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
    if (!shop || !getApiBase()) return;
    setInventorySyncing(true);
    setInventoryMessage("");

    try {
      const data = await syncInventory(shop);
      if (data?.status === "success") {
        setInventoryMessage(data.message || "Inventory synced.");
      } else if (data?.status === "skipped") {
        const lastUpdated = data.last_updated_at ? ` Last updated at: ${data.last_updated_at}` : "";
        setInventoryMessage(`${data.reason || "Inventory sync skipped."}${lastUpdated}`);
      } else {
        setInventoryMessage("Inventory sync completed.");
      }
      clearGlobalError();
      await fetchDashboardMetrics(shop);
    } catch (error) {
      if (error?.status === 404) {
        setInventoryMessage("Shop not found.");
      } else {
        setInventoryMessage(error?.message || "Inventory sync failed.");
      }
      handleApiError(error, "Inventory sync failed.", handleSyncInventory);
    } finally {
      setInventorySyncing(false);
    }
  };

  const handleSyncSales = async () => {
    if (!shop || !getApiBase() || !startDate || !endDate) return;
    setSalesSyncing(true);
    setSalesMessage("");

    try {
      const data = await syncSales(shop, startDate, endDate);
      if (data?.status === "success") {
        setSalesMessage(data.message || "Sales synced.");
      } else if (data?.status === "skipped") {
        const period = data.sales_period ? ` Sales period: ${JSON.stringify(data.sales_period)}` : "";
        setSalesMessage(`${data.reason || "Sales sync skipped."}${period}`);
      } else {
        setSalesMessage("Sales sync completed.");
      }
      clearGlobalError();
      await fetchDashboardMetrics(shop);
    } catch (error) {
      if (error?.status === 404) {
        setSalesMessage("Shop not found.");
      } else {
        setSalesMessage(error?.message || "Sales sync failed.");
      }
      handleApiError(error, "Sales sync failed.", handleSyncSales);
    } finally {
      setSalesSyncing(false);
    }
  };

  const getForecastDays = useCallback(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 1;
    }

    const diff = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return diff > 0 ? diff : 1;
  }, [startDate, endDate]);

  const handleGenerateForecast = async () => {
    if (!shop || !getApiBase() || !startDate || !endDate) return;

    setForecastGenerating(true);
    setForecastMessage("");

    try {
      await apiClient.post("/requests/report", {
        query: {
          shop_domain: shop,
          number_of_days: getForecastDays(),
          forecast_scope: forecastScope,
        },
      });

      setForecastMessage("Forecast generated.");
      clearGlobalError();
      await fetchDashboardMetrics(shop);
    } catch (error) {
      setForecastMessage(error?.message || "Forecast generation failed.");
      handleApiError(error, "Forecast generation failed.", handleGenerateForecast);
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
        {globalError ? (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/15 bg-[#2f1638]/60 px-4 py-3 text-sm text-[#f3d9ff]">
            <span>{globalError}</span>
            {showRetry && retryAction ? (
              <Button variant="secondary" className="!h-9 !w-auto px-4" onClick={retryAction}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}

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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Skeleton from "../components/ui/Skeleton";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import KPICards from "../components/KPICards";
import RawTable from "../components/RawTable";
import WorkflowPanel from "../components/WorkflowPanel";
import { syncInventory, syncSales } from "../services/requestsApi";
import { apiClient, getApiBase } from "../lib/apiClient";
import "../styles/dashboard.css";

const INVENTORY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const KPI_CACHE_KEY = "kpi_cache";
const PO_SELECTION_STORAGE_KEY = "po_builder_selected_items";
const buildPoSelectionKey = (item) => `${item?.sku || ""}::${item?.title || ""}::${item?.size || ""}`;

const Dashboard = ({ page = "overview", initialForecastData = [], rawDataLoading = false, settingsEmail = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [shop, setShop] = useState("");
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [kpiError, setKpiError] = useState("");
  const [totalSkus, setTotalSkus] = useState(null);
  const [avgSalesPerDay, setAvgSalesPerDay] = useState(null);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [unitsInStock, setUnitsInStock] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [, setInventorySyncing] = useState(false);
  const [salesSyncing, setSalesSyncing] = useState(false);
  const [forecastGenerating, setForecastGenerating] = useState(false);
  const [forecastDays, setForecastDays] = useState("");
  const [forecastDaysError, setForecastDaysError] = useState("");
  const [minimumValue, setMinimumValue] = useState("");
  const [inventorySynced, setInventorySynced] = useState(() => window.sessionStorage.getItem("merchy_inventory_synced") === "true");
  const [salesSynced, setSalesSynced] = useState(() => window.sessionStorage.getItem("merchy_sales_synced") === "true");
  const [, setInventoryStatus] = useState(() => (
    window.sessionStorage.getItem("merchy_inventory_synced") === "true" ? "synced" : "not_synced"
  ));
  const [salesStatus, setSalesStatus] = useState(() => (
    window.sessionStorage.getItem("merchy_sales_synced") === "true" ? "synced" : "not_synced"
  ));
  const [, setInventoryMessage] = useState("");
  const [salesMessage, setSalesMessage] = useState("");
  const [forecastMessage, setForecastMessage] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [showRetry, setShowRetry] = useState(false);
  const [retryAction, setRetryAction] = useState(null);
  const [forecastData, setForecastData] = useState(() => {
    try {
      const cachedForecast = window.localStorage.getItem("forecast_cache");
      return cachedForecast ? JSON.parse(cachedForecast) : [];
    } catch (_error) {
      return [];
    }
  });
  const [rawTableSearch, setRawTableSearch] = useState("");
  const [rawTableStatusFilter, setRawTableStatusFilter] = useState("all");
  const [showDaysHelp, setShowDaysHelp] = useState(false);
  const [selectedForecastItems, setSelectedForecastItems] = useState([]);
  const daysHelpRef = useRef(null);
  const canShowKpis = inventorySynced && salesSynced;

  const readKpiCache = useCallback((shopDomain) => {
    try {
      const cachedValue = window.localStorage.getItem(KPI_CACHE_KEY);
      if (!cachedValue) return null;
      const parsed = JSON.parse(cachedValue);
      if (!parsed || parsed.shop !== shopDomain || typeof parsed.metrics !== "object") {
        return null;
      }
      return parsed.metrics;
    } catch (_error) {
      return null;
    }
  }, []);

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

  const triggerCsvDownload = useCallback((blob, fallbackFilename) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fallbackFilename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
  }, []);

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

      const [totalSkusData, avgSalesData, inventoryValueData, unitsInStockData] = await Promise.all([
        apiClient.get("/dashboard/total-skus", { query }),
        apiClient.get("/dashboard/average-sales-per-day", { query }),
        apiClient.get("/dashboard/inventory-value", { query }),
        apiClient.get("/dashboard/units-in-stock", { query }),
      ]);

      setTotalSkus(extractMetricValue(totalSkusData));
      setAvgSalesPerDay(extractMetricValue(avgSalesData));
      setInventoryValue(extractMetricValue(inventoryValueData));
      setUnitsInStock(extractMetricValue(unitsInStockData));
      window.localStorage.setItem(KPI_CACHE_KEY, JSON.stringify({
        shop: shopDomain,
        metrics: {
          totalSkus: extractMetricValue(totalSkusData),
          avgSalesPerDay: extractMetricValue(avgSalesData),
          inventoryValue: extractMetricValue(inventoryValueData),
          unitsInStock: extractMetricValue(unitsInStockData),
        },
      }));
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
    if (page === "raw-data" && Array.isArray(initialForecastData)) {
      setForecastData(initialForecastData);
    }
  }, [page, initialForecastData]);

  useEffect(() => {
    setSelectedForecastItems([]);
  }, [forecastData]);

  useEffect(() => {
    if (!shop || !canShowKpis) {
      setLoadingKpis(false);
      return;
    }

    const cachedMetrics = readKpiCache(shop);
    if (cachedMetrics) {
      setTotalSkus(cachedMetrics.totalSkus ?? null);
      setAvgSalesPerDay(cachedMetrics.avgSalesPerDay ?? null);
      setInventoryValue(cachedMetrics.inventoryValue ?? null);
      setUnitsInStock(cachedMetrics.unitsInStock ?? null);
      setLoadingKpis(false);
      setKpiError("");
      return;
    }

    fetchDashboardMetrics(shop);
  }, [shop, canShowKpis, fetchDashboardMetrics, readKpiCache]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!daysHelpRef.current) return;
      if (!daysHelpRef.current.contains(event.target)) {
        setShowDaysHelp(false);
      }
    };

    if (showDaysHelp) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showDaysHelp]);

  useEffect(() => {
    if (page !== "overview" || !shop || !getApiBase()) return;

    const cachedInventory = window.localStorage.getItem("inventory_cache");
    const cachedLastSync = window.localStorage.getItem("inventory_last_sync");
    const parsedLastSync = Number(cachedLastSync);
    const hasFreshInventoryCache = (
      Boolean(cachedInventory) &&
      Number.isFinite(parsedLastSync) &&
      (Date.now() - parsedLastSync) < INVENTORY_CACHE_TTL_MS
    );

    if (hasFreshInventoryCache) {
      setInventorySynced(true);
      setInventoryStatus("synced");
      window.sessionStorage.setItem("merchy_inventory_synced", "true");
      return;
    }

    let cancelled = false;

    const loadInventory = async () => {
      setInventorySyncing(true);
      setInventoryMessage("");

      try {
        const data = await syncInventory(shop);
        if (cancelled) return;

        window.localStorage.setItem("inventory_cache", JSON.stringify(data));
        window.localStorage.setItem("inventory_last_sync", String(Date.now()));
        window.sessionStorage.setItem("merchy_inventory_synced", "true");
        setInventorySynced(true);
        setInventoryStatus("synced");

        if (data?.status === "success") {
          setInventoryMessage(data.message || "Inventory synced.");
        } else if (data?.status === "skipped") {
          const lastUpdated = data.last_updated_at ? ` Last updated at: ${data.last_updated_at}` : "";
          setInventoryMessage(`${data.reason || "Inventory sync skipped."}${lastUpdated}`);
        }
      } catch (error) {
        if (cancelled) return;
        handleApiError(error, "Inventory sync failed.");
      } finally {
        if (!cancelled) {
          setInventorySyncing(false);
        }
      }
    };

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, [page, shop, handleApiError]);

  const handlePositiveIntegerInput = (value, setter) => {
    if (value === "") {
      setter("");
      return;
    }

    if (!/^[1-9]\d*$/.test(value)) {
      return;
    }

    setter(value);
  };

  const blockInvalidNumberKeys = (event) => {
    if (["e", "E", "+", "-", "."].includes(event.key)) {
      event.preventDefault();
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
        setSalesSynced(true);
        setSalesStatus("synced");
        window.sessionStorage.setItem("merchy_sales_synced", "true");
      } else if (data?.status === "skipped") {
        const period = data.sales_period ? ` Sales period: ${JSON.stringify(data.sales_period)}` : "";
        setSalesMessage(`${data.reason || "Sales sync skipped."}${period}`);
        setSalesSynced(true);
        setSalesStatus("synced");
        window.sessionStorage.setItem("merchy_sales_synced", "true");
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

  const handleGenerateForecast = async () => {
    if (!shop) {
      setForecastMessage("Missing shop domain");
      return;
    }
    if (!getApiBase()) return;

    setForecastGenerating(true);
    setForecastMessage("");

    try {
      const rawDays = Number(forecastDays);
      if (!Number.isFinite(rawDays) || rawDays <= 0) {
        setForecastDaysError("Number of days must be greater than 0");
        return;
      }
      const numberOfDays = Math.floor(rawDays);
      setForecastDaysError("");
      const parsedMinimumValue = Number(minimumValue);
      if (!Number.isFinite(parsedMinimumValue) || parsedMinimumValue < 0) {
        setForecastMessage("Minimum Restock Value must be 0 or greater");
        return;
      }
      const payload = await apiClient.post("/requests/report", {
        query: {
          shop_domain: shop,
          number_of_days: numberOfDays,
          minimum_value: Math.floor(parsedMinimumValue),
        },
      });
      const rows = Array.isArray(payload) ? payload : [];
      setForecastData(rows);
      window.localStorage.setItem("forecast_cache", JSON.stringify(rows));
      window.localStorage.setItem("forecast_last_generated", String(Date.now()));
      window.localStorage.removeItem(KPI_CACHE_KEY);

      setForecastMessage("Forecast generated successfully.");
      clearGlobalError();
      await fetchDashboardMetrics(shop);
    } catch (error) {
      setForecastMessage(error?.message || "Forecast generation failed.");
      setForecastData([]);
      handleApiError(error, "Forecast generation failed.", handleGenerateForecast);
    } finally {
      setForecastGenerating(false);
    }
  };

  const normalizeStatusValue = useCallback((status) => {
    return String(status || "").toLowerCase().replace(/[_\s]+/g, "");
  }, []);

  const getRawStatusClasses = useCallback((status) => {
    const normalized = normalizeStatusValue(status);
    if (normalized === "fastmoving") return "bg-green-500/20 text-green-400 border border-green-500/40";
    if (normalized === "moderate") return "bg-blue-500/20 text-blue-400 border border-blue-500/40";
    if (normalized === "slowmoving") return "bg-orange-500/20 text-orange-300 border border-orange-500/40";
    if (normalized === "neversold") return "bg-zinc-500/20 text-zinc-300 border border-zinc-500/40";
    if (normalized === "stockout") return "bg-red-500/20 text-red-400 border border-red-500/40";
    return "bg-zinc-500/20 text-zinc-300 border border-zinc-500/40";
  }, [normalizeStatusValue]);

  const filteredRawTableRows = useMemo(() => {
    const search = rawTableSearch.trim().toLowerCase();
    return forecastData.filter((row) => {
      const title = String(row?.title || "").toLowerCase();
      const sku = String(row?.sku || "").toLowerCase();
      const status = normalizeStatusValue(row?.status);
      const matchesSearch = !search || title.includes(search) || sku.includes(search);
      const matchesStatus = rawTableStatusFilter === "all" || status === rawTableStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [forecastData, rawTableSearch, rawTableStatusFilter, normalizeStatusValue]);

  const handleExportRawTableCsv = () => {
    if (filteredRawTableRows.length === 0) return;
    const header = ["title", "size", "sku", "inventory", "lifetime", "sales_per_day", "status", "restock_amount"];
    const lines = filteredRawTableRows.map((row) => (
      [
        row?.title ?? "",
        row?.size ?? "",
        row?.sku ?? "",
        row?.inventory ?? "",
        row?.lifetime ?? "",
        row?.sales_per_day ?? "",
        row?.status ?? "",
        row?.restock_amount ?? "",
      ].join(",")
    ));
    const csv = `${header.join(",")}\n${lines.join("\n")}`;
    triggerCsvDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "forecast_raw_table.csv");
  };

  const mapForecastRowToPoItem = useCallback((row) => ({
    sku: String(row?.sku || ""),
    title: String(row?.title || ""),
    size: String(row?.size || ""),
    quantity: Number(row?.restock_amount) > 0 ? Number(row?.restock_amount) : 0,
  }), []);

  const selectedRawItemKeys = useMemo(() => (
    new Set(selectedForecastItems.map((item) => buildPoSelectionKey(item)))
  ), [selectedForecastItems]);

  const canSelectAllRawRows = filteredRawTableRows.length > 0;
  const areAllRawRowsSelected = (
    canSelectAllRawRows &&
    filteredRawTableRows.every((row) => selectedRawItemKeys.has(buildPoSelectionKey(row)))
  );

  const handleToggleRawRow = useCallback((row) => {
    const nextItem = mapForecastRowToPoItem(row);
    const nextKey = buildPoSelectionKey(nextItem);

    setSelectedForecastItems((currentItems) => {
      const exists = currentItems.some((item) => buildPoSelectionKey(item) === nextKey);
      if (exists) {
        return currentItems.filter((item) => buildPoSelectionKey(item) !== nextKey);
      }
      return [...currentItems, nextItem];
    });
  }, [mapForecastRowToPoItem]);

  const handleToggleAllRawRows = useCallback(() => {
    if (!canSelectAllRawRows) return;

    setSelectedForecastItems((currentItems) => {
      const filteredItems = filteredRawTableRows.map(mapForecastRowToPoItem);
      const filteredKeys = new Set(filteredItems.map((item) => buildPoSelectionKey(item)));
      const allSelected = filteredItems.every((item) => (
        currentItems.some((currentItem) => buildPoSelectionKey(currentItem) === buildPoSelectionKey(item))
      ));

      if (allSelected) {
        return currentItems.filter((item) => !filteredKeys.has(buildPoSelectionKey(item)));
      }

      const retainedItems = currentItems.filter((item) => !filteredKeys.has(buildPoSelectionKey(item)));
      return [...retainedItems, ...filteredItems];
    });
  }, [canSelectAllRawRows, filteredRawTableRows, mapForecastRowToPoItem]);

  const handleCreatePo = useCallback(() => {
    if (selectedForecastItems.length === 0) return;

    window.localStorage.setItem(PO_SELECTION_STORAGE_KEY, JSON.stringify(selectedForecastItems));
    navigate(`/po/create${location.search}`, {
      state: {
        selectedItems: selectedForecastItems,
      },
    });
  }, [location.search, navigate, selectedForecastItems]);

  const renderKpiValue = (value, formatNumber = false) => {
    if (loadingKpis) return <Skeleton className="mt-3 h-7 w-24" />;
    if (kpiError) return <p className="kpi-fallback mt-3">Unavailable</p>;
    if (value === null || value === undefined || value === "") {
      return <p className="kpi-value mt-3">-</p>;
    }
    const normalizedValue = Number(value);
    const displayValue = formatNumber && Number.isFinite(normalizedValue)
      ? normalizedValue.toLocaleString("en-US")
      : value;
    return <p className="kpi-value mt-3">{displayValue}</p>;
  };

  const getLastSyncLabel = useCallback(() => {
    const timestamp = window.localStorage.getItem("inventory_last_sync");
    if (!timestamp) return "never";

    const parsedTimestamp = Number(timestamp);
    if (!Number.isFinite(parsedTimestamp) || parsedTimestamp <= 0) return "never";

    const diffMs = Date.now() - parsedTimestamp;
    if (diffMs < 60 * 1000) return "just now";

    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  }, []);

  return (
    <div className={page === "overview" ? "dashboard-page min-h-screen" : "dashboard-page min-h-screen"}>
      <main className={`mx-auto max-w-[1320px] ${page === "overview" ? "px-8 py-8 font-sans" : "px-4 py-6 sm:px-6"}`}>
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

        <div className={`grid ${page === "overview" ? "gap-6 lg:grid-cols-[240px_minmax(0,1fr)]" : "gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"}`}>
          <Sidebar page={page} settingsEmail={settingsEmail} />

          <div className={page === "overview" ? "space-y-8" : "space-y-5"}>
            {page === "overview" ? (
              <>
                <div className="w-full pt-2">
                  <Header lastSyncLabel={getLastSyncLabel()} />
                </div>
                <WorkflowPanel
                  startDate={startDate}
                  endDate={endDate}
                  setStartDate={setStartDate}
                  setEndDate={setEndDate}
                  salesMessage={salesMessage}
                  setSalesMessage={setSalesMessage}
                  salesStatus={salesStatus}
                  salesSyncing={salesSyncing}
                  inventorySynced={inventorySynced}
                  handleSyncSales={handleSyncSales}
                  daysHelpRef={daysHelpRef}
                  showDaysHelp={showDaysHelp}
                  setShowDaysHelp={setShowDaysHelp}
                  forecastDays={forecastDays}
                  blockInvalidNumberKeys={blockInvalidNumberKeys}
                  handlePositiveIntegerInput={handlePositiveIntegerInput}
                  setForecastDays={setForecastDays}
                  setForecastDaysError={setForecastDaysError}
                  forecastDaysError={forecastDaysError}
                  minimumValue={minimumValue}
                  setMinimumValue={setMinimumValue}
                  forecastGenerating={forecastGenerating}
                  shop={shop}
                  salesSynced={salesSynced}
                  handleGenerateForecast={handleGenerateForecast}
                  forecastMessage={forecastMessage}
                />
              </>
            ) : (
              <>
                <div className="pt-4">
                  <h1 className="text-3xl font-semibold tracking-tight text-white">Raw Data</h1>
                  <p className="mt-2 text-base text-zinc-400">
                    Review KPI metrics and generated forecast rows at SKU level.
                  </p>
                </div>
                <KPICards
                  canShowKpis={canShowKpis}
                  loadingKpis={loadingKpis}
                  totalSkus={totalSkus}
                  avgSalesPerDay={avgSalesPerDay}
                  inventoryValue={inventoryValue}
                  unitsInStock={unitsInStock}
                  renderKpiValue={renderKpiValue}
                />
                <Card className="dashboard-panel p-6">
                  <RawTable
                    forecastGenerating={forecastGenerating || rawDataLoading}
                    rawTableSearch={rawTableSearch}
                    setRawTableSearch={setRawTableSearch}
                    rawTableStatusFilter={rawTableStatusFilter}
                    setRawTableStatusFilter={setRawTableStatusFilter}
                    filteredRawTableRows={filteredRawTableRows}
                    handleExportRawTableCsv={handleExportRawTableCsv}
                    getRawStatusClasses={getRawStatusClasses}
                    selectedRawItemCount={selectedForecastItems.length}
                    selectedRawItemKeys={selectedRawItemKeys}
                    areAllRawRowsSelected={areAllRawRowsSelected}
                    canSelectAllRawRows={canSelectAllRawRows}
                    handleToggleRawRow={handleToggleRawRow}
                    handleToggleAllRawRows={handleToggleAllRawRows}
                    handleCreatePo={handleCreatePo}
                  />
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

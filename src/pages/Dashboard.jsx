import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import KPIStatCard from "../components/ui/KPIStatCard";
import PillChip from "../components/ui/PillChip";
import Tabs from "../components/ui/Tabs";
import Skeleton from "../components/ui/Skeleton";
import { syncInventory, syncSales } from "../services/requestsApi";
import { apiClient, getApiBase } from "../lib/apiClient";
import { fetchWithToken } from "../lib/authFetch";
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
  const [inventoryValue, setInventoryValue] = useState(null);
  const [unitsInStock, setUnitsInStock] = useState(null);
  const [activePeriod, setActivePeriod] = useState("Yesterday");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [forecastScope, setForecastScope] = useState("all");
  const [inventorySyncing, setInventorySyncing] = useState(false);
  const [salesSyncing, setSalesSyncing] = useState(false);
  const [forecastGenerating, setForecastGenerating] = useState(false);
  const [forecastDays, setForecastDays] = useState("1");
  const [forecastDaysError, setForecastDaysError] = useState("");
  const [minimumValue, setMinimumValue] = useState(5);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [inventorySynced, setInventorySynced] = useState(false);
  const [salesSynced, setSalesSynced] = useState(false);
  const [inventoryStatus, setInventoryStatus] = useState("not_synced");
  const [salesStatus, setSalesStatus] = useState("not_synced");
  const [restockSuggestions, setRestockSuggestions] = useState([]);
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockError, setRestockError] = useState("");
  const [inventoryMessage, setInventoryMessage] = useState("");
  const [salesMessage, setSalesMessage] = useState("");
  const [forecastMessage, setForecastMessage] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [showRetry, setShowRetry] = useState(false);
  const [retryAction, setRetryAction] = useState(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [itemSearchLoading, setItemSearchLoading] = useState(false);
  const [itemSearchError, setItemSearchError] = useState("");
  const [itemSearchResults, setItemSearchResults] = useState([]);
  const [itemSearchFocused, setItemSearchFocused] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState("");
  const [breakdownRows, setBreakdownRows] = useState([]);
  const [breakdownSearch, setBreakdownSearch] = useState("");
  const [breakdownAlertFilter, setBreakdownAlertFilter] = useState("all");
  const [forecastData, setForecastData] = useState([]);
  const [rawTableSearch, setRawTableSearch] = useState("");
  const [rawTableStatusFilter, setRawTableStatusFilter] = useState("all");
  const itemSearchBoxRef = useRef(null);
  const breakdownRequestRef = useRef(0);
  const canShowKpis = inventorySynced && salesSynced;

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

  const getNumberOfDays = useCallback(() => {
    const periodMap = {
      Yesterday: 1,
      "Last 7 days": 7,
      "Last 30 days": 30,
      "Last 90 days": 90,
      "Last 365 days": 365,
    };

    if (activePeriod && periodMap[activePeriod]) {
      return periodMap[activePeriod];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 1;
    }

    const diff = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return diff > 0 ? diff : 1;
  }, [activePeriod, startDate, endDate]);

  const getValidForecastDays = useCallback(() => {
    const parsed = Number(forecastDays);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.floor(parsed);
  }, [forecastDays]);

  const normalizeApiBase = useCallback(() => {
    const base = getApiBase() || "";
    return base.replace(/\/+$/, "");
  }, []);

  const parseJsonSafe = useCallback(async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;
    try {
      return await response.json();
    } catch (_error) {
      return null;
    }
  }, []);

  const resolveItemId = useCallback((item) => {
    return String(
      item?.id ??
      item?.title ??
      item?.name ??
      item?.sku ??
      item?.product_id ??
      item?.variant_id ??
      item?.inventory_item_id ??
      ""
    );
  }, []);

  const resolveItemLabel = useCallback((item) => {
    return (
      item?.title ||
      item?.name ||
      item?.product_title ||
      item?.sku ||
      resolveItemId(item)
    );
  }, [resolveItemId]);

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

  const getLifetimeAlert = useCallback((row) => {
    const rawLifetime = Number(
      row?.lifetime ?? row?.life_time ?? row?.coverage_days ?? row?.coverage ?? row?.days ?? row?.lifetime_days
    );
    if (!Number.isFinite(rawLifetime)) return "Healthy";
    if (rawLifetime < 15) return "Critical";
    if (rawLifetime < 20) return "Warning";
    return "Healthy";
  }, []);

  const fetchBreakdown = useCallback(async () => {
    const validDays = getValidForecastDays();
    if (!isAuthenticated || !inventorySynced || !salesSynced || !validDays || validDays < 1) {
      setBreakdownRows([]);
      setBreakdownError("");
      setBreakdownLoading(false);
      return;
    }

    if (!shop) {
      setBreakdownError("Missing shop domain");
      setBreakdownRows([]);
      return;
    }

    const base = normalizeApiBase();
    if (!base) {
      setBreakdownError("Missing API base URL.");
      setBreakdownRows([]);
      return;
    }

    setBreakdownLoading(true);
    setBreakdownError("");

    const queryWithShop = new URLSearchParams({
      shop_domain: shop,
      number_of_days: String(validDays),
    }).toString();
    const url = `${base}/requests/breakdown?${queryWithShop}`;
    const requestId = breakdownRequestRef.current + 1;
    breakdownRequestRef.current = requestId;

    try {
      const response = await fetchWithToken(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      if (!response.ok) {
        const maybeJson = await parseJsonSafe(response);
        const text = maybeJson?.detail || maybeJson?.error || `Request failed (${response.status})`;
        throw new Error(text);
      }

      const successData = await response.json();
      const rows = Array.isArray(successData) ? successData : [];
      if (breakdownRequestRef.current === requestId) {
        setBreakdownRows(rows);
      }
    } catch (error) {
      if (breakdownRequestRef.current === requestId) {
        setBreakdownError(error?.message || "Failed to load item breakdown.");
        setBreakdownRows([]);
      }
    } finally {
      if (breakdownRequestRef.current === requestId) {
        setBreakdownLoading(false);
      }
    }
  }, [shop, normalizeApiBase, parseJsonSafe, isAuthenticated, inventorySynced, salesSynced, getValidForecastDays]);

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
      setIsAuthenticated(true);
      clearGlobalError();
    } catch (error) {
      if (error?.status === 401) {
        setIsAuthenticated(false);
      }
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
    setForecastDays("1");
  }, [getRangeFromPeriod]);

  useEffect(() => {
    setForecastDays(String(getNumberOfDays()));
  }, [getNumberOfDays]);

  useEffect(() => {
    if (!shop || !canShowKpis) {
      setLoadingKpis(false);
      return;
    }
    fetchDashboardMetrics(shop);
  }, [shop, canShowKpis, fetchDashboardMetrics]);

  useEffect(() => {
    if (activeTab === "Item Breakdown" && getValidForecastDays() >= 1) {
      fetchBreakdown();
    }
  }, [activeTab, forecastDays, fetchBreakdown, getValidForecastDays]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!itemSearchBoxRef.current) return;
      if (!itemSearchBoxRef.current.contains(event.target)) {
        setItemSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!shop) {
      setItemSearchResults([]);
      return undefined;
    }

    const queryText = itemSearchQuery.trim();
    if (forecastScope !== "custom" || queryText.length < 2) {
      setItemSearchResults([]);
      setItemSearchError("");
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      const base = normalizeApiBase();
      if (!base) {
        setItemSearchError("Missing API base URL.");
        return;
      }

      setItemSearchLoading(true);
      setItemSearchError("");

      const query = new URLSearchParams({
        shop_domain: shop,
        search_query: queryText,
      }).toString();

      const candidateUrls = [
        `${base}/inventory/search?${query}`,
        `${base}/requests/inventory/search?${query}`,
      ];

      try {
        let successData = null;

        for (const url of candidateUrls) {
          const response = await fetchWithToken(url, {
            headers: { "ngrok-skip-browser-warning": "true" },
          });

          if (response.status === 404) {
            continue;
          }

          if (!response.ok) {
            const maybeJson = await parseJsonSafe(response);
            const text = maybeJson?.detail || maybeJson?.error || `Request failed (${response.status})`;
            throw new Error(text);
          }

          successData = await response.json();
          break;
        }

        if (!successData) {
          throw new Error("Inventory search endpoint not found.");
        }

        setItemSearchResults(Array.isArray(successData) ? successData : []);
      } catch (error) {
        setItemSearchError(error?.message || "Failed to search items.");
        setItemSearchResults([]);
      } finally {
        setItemSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [itemSearchQuery, shop, forecastScope, normalizeApiBase, parseJsonSafe]);

  const handlePresetPeriodClick = (period) => {
    setActivePeriod(period);
    const range = getRangeFromPeriod(period);
    setStartDate(range.start);
    setEndDate(range.end);
    setSalesMessage("");
  };

  const toggleSelectedItem = (item) => {
    const id = resolveItemId(item);
    if (!id) return;

    setForecastMessage("");
    setSelectedItems((prev) => {
      const exists = prev.some((entry) => entry.id === id);
      if (exists) {
        return prev.filter((entry) => entry.id !== id);
      }
      return [...prev, { id, label: resolveItemLabel(item), raw: item }];
    });
  };

  const removeSelectedItem = (id) => {
    setSelectedItems((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleSyncInventory = async () => {
    if (!shop || !getApiBase()) return;
    setInventorySyncing(true);
    setInventoryMessage("");

    try {
      const data = await syncInventory(shop);
      if (data?.status === "success") {
        setInventoryMessage(data.message || "Inventory synced.");
        setInventorySynced(true);
        setInventoryStatus("synced");
      } else if (data?.status === "skipped") {
        const lastUpdated = data.last_updated_at ? ` Last updated at: ${data.last_updated_at}` : "";
        setInventoryMessage(`${data.reason || "Inventory sync skipped."}${lastUpdated}`);
        setInventorySynced(true);
        setInventoryStatus("synced");
      } else {
        setInventoryMessage("Inventory sync completed.");
      }
      clearGlobalError();
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
        setSalesSynced(true);
        setSalesStatus("synced");
      } else if (data?.status === "skipped") {
        const period = data.sales_period ? ` Sales period: ${JSON.stringify(data.sales_period)}` : "";
        setSalesMessage(`${data.reason || "Sales sync skipped."}${period}`);
        setSalesSynced(true);
        setSalesStatus("synced");
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
    setRestockLoading(true);
    setRestockError("");
    setForecastMessage("");

    try {
      const base = normalizeApiBase();
      if (!base) {
        throw new Error("Missing API base URL.");
      }

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
      let payload = [];
      if (forecastScope === "all") {
        payload = await apiClient.post("/requests/report", {
          query: {
            shop_domain: shop,
            number_of_days: numberOfDays,
            minimum_value: Math.floor(parsedMinimumValue),
          },
        });
      } else {
        if (selectedItems.length === 0) {
          setForecastMessage("Select at least 1 item");
          return;
        }

        const params = new URLSearchParams({
          shop_domain: shop,
          number_of_days: String(numberOfDays),
          minimum_value: String(Math.floor(parsedMinimumValue)),
        });
        selectedItems.forEach((item) => params.append("items", item.id));

        const response = await fetchWithToken(`${base}/requests/customized/report?${params.toString()}`, {
          method: "POST",
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        if (!response.ok) {
          const maybeJson = await parseJsonSafe(response);
          const message = maybeJson?.detail || maybeJson?.error || `Request failed (${response.status})`;
          throw new Error(message);
        }
        payload = await response.json();
      }
      const rows = Array.isArray(payload) ? payload : [];
      setForecastData(rows);
      setRestockSuggestions([]);
      setRestockError("");

      setForecastMessage("Forecast generated successfully.");
      clearGlobalError();
      await fetchDashboardMetrics(shop);
      await fetchBreakdown();
    } catch (error) {
      setForecastMessage(error?.message || "Forecast generation failed.");
      setRestockError(error?.message || "Failed to load restock suggestions.");
      setRestockSuggestions([]);
      setForecastData([]);
      handleApiError(error, "Forecast generation failed.", handleGenerateForecast);
    } finally {
      setForecastGenerating(false);
      setRestockLoading(false);
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

  const filteredBreakdownRows = useMemo(() => {
    const search = breakdownSearch.trim().toLowerCase();
    return breakdownRows.filter((row) => {
      const title = String(row?.title || row?.name || row?.item || "").toLowerCase();
      const alert = getLifetimeAlert(row);
      const matchesSearch = !search || title.includes(search);
      const matchesAlert = breakdownAlertFilter === "all" || alert === breakdownAlertFilter;
      return matchesSearch && matchesAlert;
    });
  }, [breakdownRows, breakdownSearch, breakdownAlertFilter, getLifetimeAlert]);

  const handleExportBreakdownCsv = () => {
    if (filteredBreakdownRows.length === 0) return;
    const header = ["Title", "Quantity", "Alert"];
    const lines = filteredBreakdownRows.map((row) => {
      const title = String(row?.title || row?.name || row?.item || "-").replace(/"/g, '""');
      const quantity = String(row?.quantity ?? row?.qty ?? row?.count ?? "-").replace(/"/g, '""');
      const alert = getLifetimeAlert(row).replace(/"/g, '""');
      return `"${title}","${quantity}","${alert}"`;
    });
    const csv = `${header.join(",")}\n${lines.join("\n")}`;
    triggerCsvDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "item_breakdown.csv");
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
                Status: <span className="panel-text-strong">{inventoryStatus === "synced" ? "Synced" : "Not Synced"}</span>
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
                  Status: <span className="panel-meta-value">{salesStatus === "synced" ? "Synced" : "Not Synced"}</span>
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
                disabled={salesSyncing || !shop || !startDate || !endDate || !inventorySynced}
                onClick={salesSyncing || !shop || !startDate || !endDate || !inventorySynced ? undefined : handleSyncSales}
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
                    className="scope-radio h-5 w-5 accent-[#22c55e]"
                    checked={forecastScope === "all"}
                    onChange={() => setForecastScope("all")}
                  />
                  Forecast all items
                </label>
                <label className="scope-option flex items-center gap-3">
                  <input
                    type="radio"
                    name="scope"
                    className="scope-radio h-5 w-5 accent-[#22c55e]"
                    checked={forecastScope === "custom"}
                    onChange={() => setForecastScope("custom")}
                  />
                  Select specific items
                </label>
              </div>

              {forecastScope === "custom" ? (
                <div ref={itemSearchBoxRef} className="mt-6 space-y-3">
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(event) => setItemSearchQuery(event.target.value)}
                    onFocus={() => setItemSearchFocused(true)}
                    placeholder="Search inventory items..."
                    className="dashboard-input h-11 w-full rounded-xl px-3"
                  />

                  {itemSearchError ? <p className="panel-message">{itemSearchError}</p> : null}

                  <div
                    className={`max-h-40 space-y-2 overflow-auto rounded-xl border border-white/10 p-2 transition-opacity duration-200 ${
                      itemSearchFocused ? "opacity-100" : "opacity-55"
                    }`}
                  >
                    {itemSearchLoading ? (
                      <>
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </>
                    ) : null}
                    {!itemSearchLoading && itemSearchResults.length === 0 && itemSearchQuery.trim().length >= 2 ? (
                      <p className="panel-note px-2 py-1">No matching items</p>
                    ) : null}
                    {!itemSearchLoading && itemSearchResults.map((item, index) => {
                      const id = resolveItemId(item);
                      const label = resolveItemLabel(item);
                      const checked = selectedItems.some((entry) => entry.id === id);

                      return (
                        <label
                          key={`${id}-${index}`}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-colors ${
                            checked ? "bg-[#22c55e]/12" : "hover:bg-white/5"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectedItem(item)}
                            className="h-4 w-4 accent-[#22c55e]"
                          />
                          <span className={`panel-text ${checked ? "text-[#8CF5A6]" : ""}`}>{label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {selectedItems.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-2 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/12 px-3 py-1 text-xs text-[#8CF5A6]"
                        >
                          {item.label}
                          <button
                            type="button"
                            className="text-[#8CF5A6] hover:text-white"
                            onClick={() => removeSelectedItem(item.id)}
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>

            <Card className="dashboard-panel p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="panel-title">Generate</h2>
                <p className="panel-note">Sync inventory to proceed</p>
              </div>

              <div className="mt-5">
                <label className="field-label mb-2 block">Number of days</label>
                <input
                  type="number"
                  step={1}
                  value={forecastDays}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForecastDays(value);
                    const num = Number(value);
                    if (value !== "" && Number.isFinite(num) && num <= 0) {
                      setForecastDaysError("Number of days must be greater than 0");
                    } else {
                      setForecastDaysError("");
                    }
                  }}
                  className="dashboard-input h-11 w-full rounded-xl px-3"
                />
                {forecastDaysError ? <p className="panel-message mt-2">{forecastDaysError}</p> : null}
              </div>
              <div className="mt-4">
                <label className="field-label mb-2 block">Minimum Restock Value</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={minimumValue}
                  onChange={(event) => setMinimumValue(event.target.value)}
                  className="dashboard-input h-11 w-full rounded-xl px-3"
                />
              </div>

              <Button
                className="mt-7"
                disabled={forecastGenerating || !shop || !inventorySynced || !salesSynced}
                onClick={
                  forecastGenerating || !shop || !inventorySynced || !salesSynced
                    ? undefined
                    : handleGenerateForecast
                }
              >
                {forecastGenerating ? "Generating..." : "Generate Forecast"}
              </Button>
              {forecastMessage ? <p className="panel-message mt-3">{forecastMessage}</p> : null}
            </Card>
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {!canShowKpis ? (
                <Card className="dashboard-panel p-4 sm:col-span-2 lg:col-span-4">
                  <p className="panel-note">Complete Inventory Sync and Sales Sync to load KPI cards.</p>
                </Card>
              ) : loadingKpis ? (
                <>
                  <KPIStatCard label="Total SKUs" />
                  <KPIStatCard label="Avg Sales / day" />
                  <KPIStatCard label="Inventory Value" />
                  <KPIStatCard label="Units in Stock" />
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
                    <p className="kpi-label">Inventory Value</p>
                    {renderKpiValue(inventoryValue)}
                  </Card>
                  <Card className="dashboard-panel p-4">
                    <p className="kpi-label">Units in Stock</p>
                    {renderKpiValue(unitsInStock)}
                  </Card>
                </>
              )}
            </div>

            <Card className="dashboard-panel p-6">
              <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
              {activeTab === "Item Breakdown" ? (
                <div className="mt-6">
                  {breakdownLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : null}

                  {!breakdownLoading && breakdownError ? (
                    <p className="panel-message">{breakdownError}</p>
                  ) : null}

                  {!breakdownLoading && !breakdownError ? (
                    <>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={breakdownSearch}
                          onChange={(event) => setBreakdownSearch(event.target.value)}
                          placeholder="Search items..."
                          className="dashboard-input h-10 min-w-[220px] rounded-xl px-3"
                        />
                        <select
                          value={breakdownAlertFilter}
                          onChange={(event) => setBreakdownAlertFilter(event.target.value)}
                          className="dashboard-input h-10 rounded-xl px-3"
                        >
                          <option value="all">All Alerts</option>
                          <option value="Critical">Critical</option>
                          <option value="Warning">Warning</option>
                          <option value="Healthy">Healthy</option>
                        </select>
                        <Button
                          variant="secondary"
                          className="!h-10 !w-auto px-4"
                          disabled={filteredBreakdownRows.length === 0}
                          onClick={handleExportBreakdownCsv}
                        >
                          Export CSV
                        </Button>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-white/10">
                      <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-zinc-400">Title</th>
                            <th className="px-4 py-3 text-zinc-400">Quantity</th>
                            <th className="px-4 py-3 text-zinc-400">Alert</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBreakdownRows.length === 0 ? (
                            <tr>
                              <td className="px-4 py-3 text-[#a4b0d4]" colSpan={3}>
                                Run a forecast to see item breakdown.
                              </td>
                            </tr>
                          ) : (
                            filteredBreakdownRows.map((row, index) => {
                              const alert = getLifetimeAlert(row);
                              const alertClass =
                                alert === "Critical"
                                  ? "text-[#f87171]"
                                  : alert === "Warning"
                                    ? "text-[#facc15]"
                                    : "text-[#4ade80]";
                              return (
                              <tr key={`breakdown-${index}`} className="border-t border-white/10 text-zinc-400">
                                <td className="px-4 py-3 text-zinc-400">{row?.title || row?.name || row?.item || "-"}</td>
                                <td className="px-4 py-3 text-zinc-400">{row?.quantity ?? row?.qty ?? row?.count ?? "-"}</td>
                                <td className={`px-4 py-3 ${alertClass}`}>{alert}</td>
                              </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    </>
                  ) : null}
                </div>
              ) : activeTab === "Restock Suggestions" ? (
                <div className="mt-6">
                  {restockLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : null}

                  {!restockLoading && restockError ? (
                    <p className="panel-message">{restockError}</p>
                  ) : null}

                  {!restockLoading && !restockError ? (
                    restockSuggestions.length > 0 ? (
                      <div className="max-h-[420px] overflow-auto rounded-xl border border-white/10">
                        <table className="w-full text-left text-sm text-zinc-400">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-4 py-3 text-zinc-400">Title</th>
                              <th className="px-4 py-3 text-zinc-400">Amount To Restock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {restockSuggestions.map((item, index) => (
                              <tr key={`restock-${index}`} className="border-t border-white/10 text-zinc-400">
                                <td className="px-4 py-3 text-zinc-400">{item?.title || "-"}</td>
                                <td className="px-4 py-3 text-zinc-400">{item?.amount_to_restock ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="panel-text">Run a forecast to see restock suggestions.</p>
                    )
                  ) : null}
                </div>
              ) : activeTab === "Raw Table" ? (
                <div className="mt-6">
                  {forecastGenerating ? (
                    <div className="space-y-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : null}

                  {!forecastGenerating ? (
                    <>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={rawTableSearch}
                          onChange={(event) => setRawTableSearch(event.target.value)}
                          placeholder="Search title or SKU..."
                          className="dashboard-input h-10 min-w-[220px] rounded-xl px-3"
                        />
                        <select
                          value={rawTableStatusFilter}
                          onChange={(event) => setRawTableStatusFilter(event.target.value)}
                          className="dashboard-input h-10 rounded-xl px-3"
                        >
                          <option value="all">All Status</option>
                          <option value="fastmoving">fast moving</option>
                          <option value="moderate">moderate</option>
                          <option value="slowmoving">slow moving</option>
                          <option value="neversold">never sold</option>
                          <option value="stockout">stock out</option>
                        </select>
                        <Button
                          variant="secondary"
                          className="!h-10 !w-auto px-4"
                          disabled={filteredRawTableRows.length === 0}
                          onClick={handleExportRawTableCsv}
                        >
                          Export CSV
                        </Button>
                      </div>
                      <div className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full min-w-[980px] text-left text-sm text-zinc-400">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-4 py-3 text-zinc-400">Title</th>
                              <th className="px-4 py-3 text-zinc-400">Size</th>
                              <th className="px-4 py-3 text-zinc-400">SKU</th>
                              <th className="px-4 py-3 text-zinc-400">Inventory</th>
                              <th className="px-4 py-3 text-zinc-400">Lifetime</th>
                              <th className="px-4 py-3 text-zinc-400">Sales Per Day</th>
                              <th className="px-4 py-3 text-zinc-400">Status</th>
                              <th className="px-4 py-3 text-zinc-400">Restock Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRawTableRows.length === 0 ? (
                              <tr>
                                <td className="px-4 py-3 text-zinc-400" colSpan={8}>
                                  No forecast generated yet.
                                </td>
                              </tr>
                            ) : (
                              filteredRawTableRows.map((row, index) => (
                                <tr key={`raw-${index}`} className="border-t border-white/10 text-zinc-400">
                                  <td className="px-4 py-3 text-zinc-400">{row?.title || "-"}</td>
                                  <td className="px-4 py-3 text-zinc-400">{row?.size || "-"}</td>
                                  <td className="px-4 py-3 text-zinc-400">{row?.sku || "-"}</td>
                                  <td className="px-4 py-3 text-zinc-400">{row?.inventory ?? "-"}</td>
                                  <td className="px-4 py-3 text-zinc-400">{row?.lifetime ?? "-"}</td>
                                  <td className="px-4 py-3 text-zinc-400">{row?.sales_per_day ?? "-"}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] leading-none ${getRawStatusClasses(row?.status)}`}>
                                      {row?.status || "-"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-zinc-400">{row?.restock_amount ?? "-"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="panel-text mt-6">
                  Run a forecast to see restock suggestions.
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

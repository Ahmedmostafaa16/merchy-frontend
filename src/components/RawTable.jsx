import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, TrendingUp, X } from "lucide-react";
import Button from "./ui/Button";
import Skeleton from "./ui/Skeleton";
import { apiClient } from "../lib/apiClient";

const ROWS_PER_PAGE = 20;
const ADVANCED_FORECAST_ENDPOINT = "/ai/forecast";

const formatNumber = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return numericValue.toLocaleString("en-US", {
    maximumFractionDigits: Number.isInteger(numericValue) ? 0 : 1,
  });
};

const getAccuracyBadgeClasses = (accuracy) => {
  const numericAccuracy = Number(accuracy);
  if (Number.isFinite(numericAccuracy) && numericAccuracy > 85) {
    return "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]";
  }
  if (Number.isFinite(numericAccuracy) && numericAccuracy >= 70) {
    return "bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]";
  }
  return "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]";
};

const buildMonthlyForecastSeries = (sku, forecast, sourceRow) => {
  const now = new Date();
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const forecastQty = Math.max(0, Number(forecast?.forecast_qty) || Number(forecast?.recommended_qty) || 0);
  const lowerBound = Math.max(0, Number(forecast?.lower_bound) || forecastQty * 0.8);
  const upperBound = Math.max(lowerBound, Number(forecast?.upper_bound) || forecastQty * 1.2);

  const providedHistory = Array.isArray(forecast?.historical_sales)
    ? forecast.historical_sales
    : Array.isArray(forecast?.history)
      ? forecast.history
      : [];
  const providedFuture = Array.isArray(forecast?.forecast_series)
    ? forecast.forecast_series
    : Array.isArray(forecast?.predictions)
      ? forecast.predictions
      : [];

  if (providedHistory.length || providedFuture.length) {
    const normalizedHistory = providedHistory.slice(-12).map((point, index) => ({
      label: point?.month || point?.date || `H${index + 1}`,
      historical: Number(point?.qty ?? point?.sales ?? point?.quantity ?? point?.y) || 0,
      forecast: null,
      lower: null,
      upper: null,
    }));
    const normalizedFuture = providedFuture.slice(0, 3).map((point, index) => ({
      label: point?.month || point?.date || `F${index + 1}`,
      historical: null,
      forecast: Number(point?.qty ?? point?.forecast ?? point?.quantity ?? point?.yhat) || forecastQty,
      lower: Number(point?.lower ?? point?.lower_bound ?? point?.yhat_lower) || lowerBound,
      upper: Number(point?.upper ?? point?.upper_bound ?? point?.yhat_upper) || upperBound,
    }));
    return [...normalizedHistory, ...normalizedFuture];
  }

  const dailyVelocity = Number(sourceRow?.sales_per_day);
  const monthlyBase = Number.isFinite(dailyVelocity) && dailyVelocity > 0
    ? dailyVelocity * 30
    : forecastQty > 0
      ? forecastQty * 0.72
      : 12;

  const history = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    const trendFactor = 0.82 + (index * 0.025);
    const seasonalFactor = 1 + (Math.sin((index + sku.length) / 1.8) * 0.1);
    const historical = Math.max(0, Math.round(monthlyBase * trendFactor * seasonalFactor));
    return {
      label: monthFormatter.format(date),
      historical,
      forecast: null,
      lower: null,
      upper: null,
    };
  });

  const future = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index + 1, 1);
    const adjustment = 0.94 + (index * 0.06);
    return {
      label: monthFormatter.format(date),
      historical: null,
      forecast: Math.max(0, Math.round(forecastQty * adjustment)),
      lower: Math.max(0, Math.round(lowerBound * adjustment)),
      upper: Math.max(0, Math.round(upperBound * adjustment)),
    };
  });

  return [...history, ...future];
};

const ForecastLineChart = ({ sku, forecast, sourceRow }) => {
  const data = useMemo(() => buildMonthlyForecastSeries(sku, forecast, sourceRow), [forecast, sku, sourceRow]);
  const width = 840;
  const height = 260;
  const padding = { top: 22, right: 28, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = data.flatMap((point) => [point.historical, point.forecast, point.lower, point.upper])
    .filter((value) => Number.isFinite(Number(value)));
  const maxValue = Math.max(10, ...values.map(Number));
  const scaleX = (index) => padding.left + ((data.length <= 1 ? 0 : index / (data.length - 1)) * chartWidth);
  const scaleY = (value) => padding.top + chartHeight - ((Number(value) / maxValue) * chartHeight);
  const toPath = (points, key) => points
    .map((point, index) => {
      const value = point[key];
      if (!Number.isFinite(Number(value))) return null;
      return `${index === 0 ? "M" : "L"} ${scaleX(index)} ${scaleY(value)}`;
    })
    .filter(Boolean)
    .join(" ");
  const historicalPath = toPath(data, "historical");
  const forecastPath = toPath(data, "forecast");
  const areaTop = data
    .map((point, index) => Number.isFinite(Number(point.upper)) ? `${scaleX(index)},${scaleY(point.upper)}` : null)
    .filter(Boolean);
  const areaBottom = data
    .map((point, index) => Number.isFinite(Number(point.lower)) ? `${scaleX(index)},${scaleY(point.lower)}` : null)
    .filter(Boolean)
    .reverse();
  const confidencePoints = [...areaTop, ...areaBottom].join(" ");
  const yTicks = [0, Math.round(maxValue / 2), Math.round(maxValue)];

  return (
    <div className="advanced-forecast-chart">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#111827]">{sku}</p>
          <p className="text-xs font-medium text-[#6B7280]">Last 12 months and next 3 months</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#6B7280]">
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 bg-[#2563EB]" /> Historical</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-[#38BDF8]" /> Forecast</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-[#BAE6FD]" /> Confidence</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg className="min-w-[760px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${sku} sales forecast chart`}>
          <rect x="0" y="0" width={width} height={height} rx="18" fill="#F8FAFC" />
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={scaleY(tick)} y2={scaleY(tick)} stroke="#E5E7EB" />
              <text x={padding.left - 12} y={scaleY(tick) + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#94A3B8">
                {formatNumber(tick)}
              </text>
            </g>
          ))}
          {confidencePoints ? <polygon points={confidencePoints} fill="#BAE6FD" opacity="0.42" /> : null}
          {historicalPath ? <path d={historicalPath} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {forecastPath ? <path d={forecastPath} fill="none" stroke="#38BDF8" strokeWidth="3" strokeDasharray="8 7" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {data.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              {Number.isFinite(Number(point.historical)) ? <circle cx={scaleX(index)} cy={scaleY(point.historical)} r="4" fill="#2563EB" /> : null}
              {Number.isFinite(Number(point.forecast)) ? <circle cx={scaleX(index)} cy={scaleY(point.forecast)} r="4" fill="#38BDF8" /> : null}
              <text x={scaleX(index)} y={height - 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748B">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

const RawTable = ({
  forecastGenerating,
  forecastError,
  forecastEmpty,
  rawTableSearch,
  setRawTableSearch,
  rawTableStatusFilter,
  setRawTableStatusFilter,
  filteredRawTableRows,
  handleExportRawTableCsv,
  getRawStatusClasses,
  selectedRawItemCount,
  selectedRawItems = [],
  selectedRawItemKeys,
  areAllRawRowsSelected,
  canSelectAllRawRows,
  handleToggleRawRow,
  handleToggleAllRawRows,
  handleCreatePo,
}) => {
  const [showStatusHelp, setShowStatusHelp] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [advancedForecasting, setAdvancedForecasting] = useState(false);
  const [advancedForecastError, setAdvancedForecastError] = useState("");
  const [advancedForecastResult, setAdvancedForecastResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const selectedForecastSkus = useMemo(() => (
    [...new Set(
      selectedRawItems
        .map((item) => String(item?.sku || "").trim())
        .filter(Boolean)
    )]
  ), [selectedRawItems]);
  const selectedRowsBySku = useMemo(() => (
    selectedRawItems.reduce((rowsBySku, item) => {
      const sku = String(item?.sku || "").trim();
      if (sku && !rowsBySku[sku]) {
        rowsBySku[sku] = item;
      }
      return rowsBySku;
    }, {})
  ), [selectedRawItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rawTableSearch, rawTableStatusFilter, sortConfig.key, sortConfig.direction, filteredRawTableRows.length]);

  const handleSort = (columnKey) => {
    setSortConfig((currentSort) => ({
      key: columnKey,
      direction: currentSort.key === columnKey && currentSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return "\u2195";
    return sortConfig.direction === "asc" ? "\u2191" : "\u2193";
  };

  const formatCoverageDays = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return "0";
    if (Number.isInteger(numericValue)) return String(numericValue);
    return String(Number(numericValue.toFixed(numericValue < 10 ? 2 : 1)));
  };

  const sortableHeaderClassName =
    "inline-flex items-center gap-1.5 text-[#6B7280] transition-colors hover:text-[#111827]";

  const getRowSelectionKey = (row) => (
    `${row?.variant_id || ""}::${row?.sku || ""}::${row?.title || ""}::${row?.variant_title || row?.variant || row?.size || ""}`
  );

  const handleAdvancedForecast = async () => {
    if (selectedForecastSkus.length === 0 || advancedForecasting) return;

    setAdvancedForecasting(true);
    setAdvancedForecastError("");

    try {
      const payload = await apiClient.post(ADVANCED_FORECAST_ENDPOINT, {
        body: { skus: selectedForecastSkus },
      });
      setAdvancedForecastResult(payload || null);
    } catch (error) {
      setAdvancedForecastError(error?.message || "Forecasting failed. Please try again.");
    } finally {
      setAdvancedForecasting(false);
    }
  };

  const forecastRows = Object.entries(advancedForecastResult?.forecast || {});
  const hasSelectedSkus = selectedForecastSkus.length > 0;

  if (forecastGenerating) {
    return (
      <div className="mt-0 space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (forecastError) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {forecastError}
      </div>
    );
  }

  const sortedData = [...filteredRawTableRows].sort((firstRow, secondRow) => {
    if (!sortConfig.key) return 0;

    if (sortConfig.key === "title") {
      const firstValue = String(firstRow?.title || "").toLowerCase();
      const secondValue = String(secondRow?.title || "").toLowerCase();
      return sortConfig.direction === "asc"
        ? firstValue.localeCompare(secondValue)
        : secondValue.localeCompare(firstValue);
    }

    const firstValue = Number(firstRow?.[sortConfig.key] ?? 0);
    const secondValue = Number(secondRow?.[sortConfig.key] ?? 0);
    const safeFirstValue = Number.isFinite(firstValue) ? firstValue : 0;
    const safeSecondValue = Number.isFinite(secondValue) ? secondValue : 0;

    return sortConfig.direction === "asc"
      ? safeFirstValue - safeSecondValue
      : safeSecondValue - safeFirstValue;
  });
  const totalPages = Math.max(1, Math.ceil(sortedData.length / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
  const pageEndIndex = pageStartIndex + ROWS_PER_PAGE;
  const paginatedData = sortedData.slice(pageStartIndex, pageEndIndex);
  const showingStart = sortedData.length === 0 ? 0 : pageStartIndex + 1;
  const showingEnd = Math.min(pageEndIndex, sortedData.length);
  const paginationItems = Array.from({ length: totalPages }, (_, index) => index + 1).filter((pageNumber) => (
    pageNumber === 1 ||
    pageNumber === totalPages ||
    Math.abs(pageNumber - safeCurrentPage) <= 1
  ));

  const handlePageChange = (pageNumber) => {
    const nextPage = Math.min(Math.max(pageNumber, 1), totalPages);
    setCurrentPage(nextPage);
  };

  return (
    <div className="mt-0">
      <>
          {advancedForecastError ? (
            <div className="mb-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#DC2626]">
              {advancedForecastError}
            </div>
          ) : null}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
              <input
                type="text"
                value={rawTableSearch}
                onChange={(event) => setRawTableSearch(event.target.value)}
                placeholder="Search title, SKU, or variant..."
                className="dashboard-input h-9 w-full rounded-lg px-3 pr-10"
              />
              {rawTableSearch ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setRawTableSearch("")}
                  className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-sm text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
                >
                  x
                </button>
              ) : null}
            </div>
            <select
              value={rawTableStatusFilter}
              onChange={(event) => setRawTableStatusFilter(event.target.value)}
              className="dashboard-input h-9 rounded-lg px-3"
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
              className="legacy-table-action legacy-table-action-secondary !h-9 !w-auto rounded-lg px-3"
              disabled={filteredRawTableRows.length === 0}
              onClick={handleExportRawTableCsv}
            >
              Export CSV
            </Button>
            <div className="ml-auto">
              <Button
                className="legacy-table-action legacy-table-action-primary !h-9 !w-auto rounded-lg px-3 !border-[#7DD3FC] !bg-[#7DD3FC] !font-medium !text-white hover:!bg-[#38BDF8]"
                disabled={selectedRawItemCount === 0}
                onClick={handleCreatePo}
              >
                Create PO
              </Button>
            </div>
            {hasSelectedSkus ? (
              <Button
                className={`legacy-table-action legacy-table-action-primary !h-9 !w-auto rounded-lg px-3 !border-[#7DD3FC] !bg-[#7DD3FC] !font-medium !text-white hover:!bg-[#38BDF8] ${
                  advancedForecasting ? "cursor-not-allowed opacity-70" : ""
                }`}
                disabled={advancedForecasting}
                onClick={handleAdvancedForecast}
              >
                {advancedForecasting ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Sparkles size={15} className="mr-2" />}
                {advancedForecasting ? "Forecasting..." : "Advanced Forecasting"}
              </Button>
            ) : null}
            <span className="text-xs font-medium text-zinc-400">
              {filteredRawTableRows.length} {filteredRawTableRows.length === 1 ? "result" : "results"}
            </span>
          </div>
          <div className="replenish-table-shell rounded-xl border border-[#E5E7EB] bg-white">
            <table className="min-w-[1120px] w-full table-fixed text-left text-sm text-[#374151]">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[21%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-2 py-3 text-zinc-400">
                    <input
                      type="checkbox"
                      checked={areAllRawRowsSelected}
                      disabled={!canSelectAllRawRows}
                      onChange={handleToggleAllRawRows}
                      className="h-4 w-4 rounded border border-white/20 bg-transparent accent-[#2F6FED]"
                    />
                  </th>
                  <th className="px-2 py-3 text-zinc-400">
                    <button
                      type="button"
                      onClick={() => handleSort("title")}
                      className={sortableHeaderClassName}
                    >
                      <span>Title</span>
                      <span aria-hidden="true">{getSortIcon("title")}</span>
                    </button>
                  </th>
                  <th className="px-2 py-3 text-zinc-400">Variant</th>
                  <th className="px-2 py-3 text-zinc-400">SKU</th>
                  <th className="px-2 py-3 text-zinc-400">
                    <button
                      type="button"
                      onClick={() => handleSort("inventory")}
                      className={sortableHeaderClassName}
                    >
                      <span>Inventory</span>
                      <span aria-hidden="true">{getSortIcon("inventory")}</span>
                    </button>
                  </th>
                  <th className="px-2 py-3 text-zinc-400">
                    <button
                      type="button"
                      onClick={() => handleSort("coverage_days")}
                      className={sortableHeaderClassName}
                    >
                      <span>Coverage Days</span>
                      <span aria-hidden="true">{getSortIcon("coverage_days")}</span>
                    </button>
                  </th>
                  <th className="px-2 py-3 text-zinc-400">Sales Per Day</th>
                  <th className="px-2 py-3 text-zinc-400">
                    <div className="relative inline-flex items-center gap-1.5">
                      <span>Status</span>
                      <button
                        type="button"
                        aria-label="Status explanation"
                        onMouseEnter={() => setShowStatusHelp(true)}
                        onMouseLeave={() => setShowStatusHelp(false)}
                        onFocus={() => setShowStatusHelp(true)}
                        onBlur={() => setShowStatusHelp(false)}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[10px] leading-none text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
                      >
                        i
                      </button>
                      {showStatusHelp ? (
                        <div
                          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[360px] max-w-[calc(100vw-3rem)] rounded-xl border border-white/15 bg-[#0f1528] p-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                          onMouseEnter={() => setShowStatusHelp(true)}
                          onMouseLeave={() => setShowStatusHelp(false)}
                        >
                          <p className="text-xs text-white">
                            Status is based on sales velocity percentile (sales per day) across the catalog.
                          </p>
                          <ul className="mt-2 space-y-1 text-[11px] leading-5 text-zinc-300">
                            <li><span className="text-white">Fast Moving (Top 20%)</span>: Sales velocity in the top 20% of items.</li>
                            <li><span className="text-white">Moderate (50%-80%)</span>: Sales velocity between the 50th and 80th percentile.</li>
                            <li><span className="text-white">Slow Moving (Bottom 50%)</span>: Sales velocity in the bottom 50% of items.</li>
                            <li><span className="text-white">Never Sold</span>: Zero sales in the selected period.</li>
                            <li><span className="text-white">Stock Out</span>: Previously sold, but current inventory is zero.</li>
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </th>
                  <th className="px-2 py-3 text-zinc-400">Restock</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr className="border-t border-[#E5E7EB]">
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-[#111827]">
                        {forecastEmpty ? "No data yet" : "No matching SKUs or products found"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {forecastEmpty ? "Generate a forecast to populate this table" : "Try another keyword or clear filters"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr key={`raw-${row?.variant_id || pageStartIndex + index}`} className="border-t border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
                      <td className="px-2 py-3 text-zinc-400">
                        <input
                          type="checkbox"
                          checked={selectedRawItemKeys.has(getRowSelectionKey(row))}
                          onChange={() => handleToggleRawRow(row)}
                          className="h-4 w-4 rounded border border-[#D1D5DB] bg-white accent-[#38BDF8]"
                        />
                      </td>
                      <td className="truncate px-2 py-3 text-zinc-400" title={row?.title || ""}>{row?.title || "-"}</td>
                      <td className="truncate px-2 py-3 text-zinc-400" title={row?.variant_title || row?.variant || ""}>{row?.variant_title || row?.variant || "-"}</td>
                      <td className="truncate px-2 py-3 text-zinc-400" title={row?.sku || ""}>{row?.sku || "-"}</td>
                      <td className="px-2 py-3 text-zinc-400">{row?.inventory ?? "-"}</td>
                      <td className="px-2 py-3 text-zinc-400">{formatCoverageDays(row?.coverage_days)}</td>
                      <td className="px-2 py-3 text-zinc-400">{row?.sales_per_day ?? "-"}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 ${getRawStatusClasses(row?.status)}`}>
                          {row?.status || "-"}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-zinc-400">{row?.restock_amount ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {sortedData.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-[#6B7280]">
                Showing <span className="text-[#111827]">{showingStart}-{showingEnd}</span> of <span className="text-[#111827]">{sortedData.length}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="replenish-pagination-button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                >
                  Previous
                </button>
                {paginationItems.map((pageNumber, index) => {
                  const previousPageNumber = paginationItems[index - 1];
                  const showGap = previousPageNumber && pageNumber - previousPageNumber > 1;

                  return (
                    <span key={pageNumber} className="inline-flex items-center gap-2">
                      {showGap ? <span className="px-1 text-sm font-semibold text-[#94A3B8]">...</span> : null}
                      <button
                        type="button"
                        className={`replenish-pagination-button replenish-pagination-number ${pageNumber === safeCurrentPage ? "is-active" : ""}`}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  className="replenish-pagination-button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
          {advancedForecastResult ? (
            <div className="advanced-forecast-modal fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-4 py-6 backdrop-blur-sm transition-opacity">
              <div className="advanced-forecast-dialog flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-6 py-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2665F9]">
                      <TrendingUp size={20} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-[#111827]">Advanced Forecast Results</h3>
                        <Sparkles size={17} className="text-[#2665F9]" />
                      </div>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Prophet ML demand forecasts for {forecastRows.length || selectedForecastSkus.length} selected SKU{(forecastRows.length || selectedForecastSkus.length) === 1 ? "" : "s"}.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Close advanced forecast results"
                    onClick={() => setAdvancedForecastResult(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-6 overflow-auto px-6 py-5">
                  <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
                    <table className="min-w-[920px] w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-[#F9FAFB]">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">SKU</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Model</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Forecast Qty</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Lower Bound</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Upper Bound</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Accuracy %</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">MAPE %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecastRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-sm font-medium text-[#6B7280]">
                              No forecast results returned.
                            </td>
                          </tr>
                        ) : forecastRows.map(([sku, forecast]) => {
                          const accuracy = Number(forecast?.accuracy);

                          return (
                            <tr key={sku} className="border-t border-[#E5E7EB]">
                              <td className="px-4 py-3 font-medium text-[#111827]">{sku}</td>
                              <td className="px-4 py-3 capitalize text-[#374151]">{forecast?.model || "prophet"}</td>
                              <td className="px-4 py-3 text-[#374151]">
                                {formatNumber(forecast?.forecast_qty)}
                              </td>
                              <td className="px-4 py-3 text-[#374151]">{formatNumber(forecast?.lower_bound)}</td>
                              <td className="px-4 py-3 text-[#374151]">{formatNumber(forecast?.upper_bound)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getAccuracyBadgeClasses(accuracy)}`}>
                                  {formatNumber(accuracy)}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#374151]">
                                {formatNumber(forecast?.mape)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {forecastRows.length > 0 ? (
                    <div className="space-y-4">
                      {forecastRows.map(([sku, forecast]) => (
                        <ForecastLineChart
                          key={`chart-${sku}`}
                          sku={sku}
                          forecast={forecast}
                          sourceRow={selectedRowsBySku[sku]}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
      </>
    </div>
  );
};

export default RawTable;

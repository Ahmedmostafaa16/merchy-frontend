import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { Loader2, Sparkles, TrendingUp, X } from "lucide-react";
import Button from "./ui/Button";
import Skeleton from "./ui/Skeleton";
import { apiClient } from "../lib/apiClient";

const ROWS_PER_PAGE = 20;

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

  // eslint-disable-next-line no-unused-vars
  const handleAdvancedForecast = async () => {
    const skus = [...new Set(
      selectedRawItems
        .map((item) => String(item?.sku || "").trim())
        .filter(Boolean)
    )];

    if (skus.length === 0 || advancedForecasting) return;

    setAdvancedForecasting(true);
    setAdvancedForecastError("");

    try {
      const payload = await apiClient.post("/ai/forecast", {
        body: { skus },
      });
      setAdvancedForecastResult(payload || null);
    } catch (_error) {
      setAdvancedForecastError("Forecasting failed. Please try again.");
    } finally {
      setAdvancedForecasting(false);
    }
  };

  const forecastRows = Object.entries(advancedForecastResult?.forecast || {});

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
            {/* Advanced Forecasting button intentionally hidden from the UI for now.
                The request logic and results modal remain in code for future re-enable. */}
            {/*
              <Button
                className={`!h-9 !w-auto rounded-lg px-3 !border-[#7DD3FC] !bg-[#7DD3FC] !font-medium !text-white hover:!bg-[#38BDF8] ${
                  selectedRawItemCount === 0 || advancedForecasting ? "opacity-60 cursor-not-allowed" : ""
                }`}
                disabled={selectedRawItemCount === 0 || advancedForecasting}
                onClick={handleAdvancedForecast}
              >
                {advancedForecasting ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Sparkles size={15} className="mr-2" />}
                {advancedForecasting ? "Forecasting..." : "Advanced Forecasting"}
              </Button>
            */}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-4 backdrop-blur-sm transition-opacity">
              <div className="w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
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
                        ML-powered demand recommendations for selected SKUs.
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

                <div className="max-h-[420px] overflow-auto px-6 py-5">
                  <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F9FAFB]">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">SKU</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Recommended Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecastRows.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-4 py-6 text-center text-sm text-[#6B7280]">
                              No recommendations returned.
                            </td>
                          </tr>
                        ) : forecastRows.map(([sku, forecast]) => {
                          const recommendedQty = Number(forecast?.recommended_qty);
                          const hasRecommendation = Number.isFinite(recommendedQty) && recommendedQty > 0;

                          return (
                            <tr key={sku} className="border-t border-[#E5E7EB]">
                              <td className="px-4 py-3 font-medium text-[#111827]">{sku}</td>
                              <td className="px-4 py-3 text-[#374151]">
                                {hasRecommendation ? `${recommendedQty} units` : "Low confidence / insufficient sales data"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
      </>
    </div>
  );
};

export default RawTable;

import { useState } from "react";
import Button from "./ui/Button";
import Skeleton from "./ui/Skeleton";

const RawTable = ({
  forecastGenerating,
  rawTableSearch,
  setRawTableSearch,
  rawTableStatusFilter,
  setRawTableStatusFilter,
  filteredRawTableRows,
  handleExportRawTableCsv,
  getRawStatusClasses,
}) => {
  const [showStatusHelp, setShowStatusHelp] = useState(false);

  return (
    <div className="mt-0">
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
                  <th className="px-4 py-3 text-zinc-400">
                    <div className="relative inline-flex items-center gap-1">
                      <span>Status</span>
                      <button
                        type="button"
                        aria-label="Status explanation"
                        onMouseEnter={() => setShowStatusHelp(true)}
                        onMouseLeave={() => setShowStatusHelp(false)}
                        onFocus={() => setShowStatusHelp(true)}
                        onBlur={() => setShowStatusHelp(false)}
                        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-white/15 text-[10px] leading-none text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
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
  );
};

export default RawTable;

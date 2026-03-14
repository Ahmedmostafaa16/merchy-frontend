import Button from "./ui/Button";
import Card from "./ui/Card";
import Skeleton from "./ui/Skeleton";

const ItemBreakdown = ({
  breakdownLoading,
  breakdownError,
  breakdownSearch,
  setBreakdownSearch,
  breakdownAlertFilter,
  setBreakdownAlertFilter,
  filteredBreakdownRows,
  handleExportBreakdownCsv,
  getLifetimeAlert,
}) => {
  return (
    <Card className="dashboard-panel p-6">
      <h2 className="panel-title">Item Breakdown</h2>
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
    </Card>
  );
};

export default ItemBreakdown;

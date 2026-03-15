import { ChartNoAxesColumn, Sparkles } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";

const WorkflowPanel = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  salesMessage,
  setSalesMessage,
  salesSyncing,
  inventorySynced,
  handleSyncSales,
  daysHelpRef,
  showDaysHelp,
  setShowDaysHelp,
  forecastDays,
  blockInvalidNumberKeys,
  handlePositiveIntegerInput,
  setForecastDays,
  setForecastDaysError,
  forecastDaysError,
  minimumValue,
  setMinimumValue,
  forecastGenerating,
  shop,
  salesSynced,
  handleGenerateForecast,
  forecastMessage,
}) => {
  return (
    <div className="w-full space-y-8">
      <Card className="dashboard-panel p-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#197FE6] text-white">
            <ChartNoAxesColumn size={18} />
          </span>
          <h2 className="text-lg font-semibold text-white">Forecast Settings</h2>
        </div>

        <div className="mt-6 rounded-[14px] border border-white/10 bg-white/5 p-7">
          <p className="text-sm leading-6 text-zinc-400">
            Set the parameters for the inventory forecast generator. These values determine the historical data used and the logic for restock recommendations.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr_180px] lg:items-end">
            <div className="flex flex-col gap-1.5">
              <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">
                Historical data start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setSalesMessage("");
                }}
                className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">
                Historical data end date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setSalesMessage("");
                }}
                className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
              />
            </div>
            <div className="justify-self-start">
              <Button
                variant="secondary"
                className="!m-0 !flex !h-11 !w-[180px] !items-center !justify-center px-4 !rounded-lg"
                disabled={salesSyncing || !shop || !startDate || !endDate || !inventorySynced}
                onClick={salesSyncing || !shop || !startDate || !endDate || !inventorySynced ? undefined : handleSyncSales}
              >
                {salesSyncing ? "Confirming..." : "Confirm Dates"}
              </Button>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-white/10 pt-8 lg:border-t-0 lg:pt-0">
              <div className="relative" ref={daysHelpRef}>
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-[13px] font-medium text-[#9CA3AF]">
                    Forecast horizon (days)
                  </label>
                  <button
                    type="button"
                    aria-label="How number of days works"
                    onClick={() => setShowDaysHelp((prev) => !prev)}
                    className="text-[11px] font-medium text-[#4EA1FF] transition-colors hover:text-white"
                  >
                    How it works
                  </button>
                </div>
                {showDaysHelp ? (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[320px] max-w-[calc(100vw-3rem)] rounded-xl border border-white/10 bg-[#0f1528] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white">How long should this stock last?</p>
                      <button
                        type="button"
                        aria-label="Close number of days help"
                        onClick={() => setShowDaysHelp(false)}
                        className="text-xs text-zinc-400 transition-colors hover:text-white"
                      >
                        x
                      </button>
                    </div>
                    <p className="text-xs leading-5 text-zinc-300">
                      Enter the number of days you want your inventory to cover. This helps generate a better restock estimate.
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Example: 30 means you want enough stock for the next 30 days.
                    </p>
                  </div>
                ) : null}
              </div>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Enter number of days"
                step={1}
                value={forecastDays}
                onKeyDown={blockInvalidNumberKeys}
                onChange={(event) => {
                  const value = event.target.value;
                  handlePositiveIntegerInput(value, setForecastDays);
                  setForecastDaysError("");
                }}
                className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
              />
              {forecastDaysError ? <p className="mt-2 text-xs text-[#DC2626]">{forecastDaysError}</p> : null}
            </div>

            <div className="mt-4 flex flex-col gap-1.5 lg:mt-0 lg:border-t-0 lg:pt-0">
              <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">
                Minimum safety stock per SKU
              </label>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Enter minimum restock value per sku"
                step={1}
                value={minimumValue}
                onKeyDown={blockInvalidNumberKeys}
                onChange={(event) => handlePositiveIntegerInput(event.target.value, setMinimumValue)}
                className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
              />
            </div>

            <div className="mt-4 justify-self-start lg:mt-0 lg:border-t-0 lg:pt-0">
              <Button
                className="!m-0 !flex !h-11 !w-[180px] !items-center !justify-center px-5 !rounded-lg !border-0 !bg-[#2F6FED] !text-white !shadow-none hover:!bg-[#1F5AE0]"
                disabled={
                  forecastGenerating ||
                  !shop ||
                  !inventorySynced ||
                  !salesSynced ||
                  !startDate ||
                  !endDate ||
                  !forecastDays ||
                  !minimumValue
                }
                onClick={
                  forecastGenerating ||
                  !shop ||
                  !inventorySynced ||
                  !salesSynced ||
                  !startDate ||
                  !endDate ||
                  !forecastDays ||
                  !minimumValue
                    ? undefined
                    : handleGenerateForecast
                }
              >
                {!forecastGenerating ? <Sparkles size={16} className="mr-2" /> : null}
                {forecastGenerating ? "Generating..." : "Generate Forecast"}
              </Button>
            </div>
          </div>
        </div>

        {salesMessage ? <p className="mt-5 text-xs text-zinc-400">{salesMessage}</p> : null}
        {forecastMessage ? <p className="mt-3 text-xs text-zinc-400">{forecastMessage}</p> : null}
      </Card>
    </div>
  );
};

export default WorkflowPanel;

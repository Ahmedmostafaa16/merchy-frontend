import { useState } from "react";
import { Bell, ChartNoAxesColumn, Sparkles } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";

const WorkflowPanel = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  salesMessage,
  setSalesMessage,
  salesStatus,
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
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailySummaryReport, setDailySummaryReport] = useState(false);

  return (
    <div className="w-full space-y-8">
      <Card className="!rounded-[14px] !border-[#E6EAF0] !bg-white p-7 !shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#197FE6] text-white">
            <ChartNoAxesColumn size={18} />
          </span>
          <h2 className="text-lg font-semibold text-[#0F172A]">Forecast Settings</h2>
        </div>

        <div className="mt-6 rounded-[14px] border border-[#E6EAF0] bg-[#F7F9FC] p-7">
          <p className="text-sm leading-6 text-[#6B7280]">
            Set the parameters for the inventory forecast generator. These values determine the historical data used and the logic for restock recommendations.
          </p>

          <div className="mt-8 grid items-center gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                Historical Data Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setSalesMessage("");
                }}
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#2F6FED] focus:ring-2 focus:ring-[#DBEAFE]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                Historical Data End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setSalesMessage("");
                }}
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#2F6FED] focus:ring-2 focus:ring-[#DBEAFE]"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="!h-11 !w-auto min-w-[156px] px-4 !rounded-lg !border-[#E5E7EB] !bg-[#F3F4F6] !text-[#111827] !shadow-none hover:!bg-[#E5E7EB]"
                disabled={salesSyncing || !shop || !startDate || !endDate || !inventorySynced}
                onClick={salesSyncing || !shop || !startDate || !endDate || !inventorySynced ? undefined : handleSyncSales}
              >
                {salesSyncing ? "Confirming..." : "Confirm Dates"}
              </Button>
            </div>
          </div>

          <div className="mt-8 border-t border-[#F1F3F6] pt-8 lg:grid lg:grid-cols-[1fr_1fr_auto] lg:items-center lg:gap-4">
            <div>
              <div className="relative" ref={daysHelpRef}>
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Forecast Horizon (Days)
                  </label>
                  <button
                    type="button"
                    aria-label="How number of days works"
                    onClick={() => setShowDaysHelp((prev) => !prev)}
                    className="text-[11px] font-medium text-[#2F6FED] transition-colors hover:text-[#1F5AE0]"
                  >
                    How it works
                  </button>
                </div>
                {showDaysHelp ? (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[320px] max-w-[calc(100vw-3rem)] rounded-xl border border-[#E6EAF0] bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[#0F172A]">How long should this stock last?</p>
                      <button
                        type="button"
                        aria-label="Close number of days help"
                        onClick={() => setShowDaysHelp(false)}
                        className="text-xs text-[#94A3B8] transition-colors hover:text-[#0F172A]"
                      >
                        x
                      </button>
                    </div>
                    <p className="text-xs leading-5 text-[#475569]">
                      Enter the number of days you want your inventory to cover. This helps generate a better restock estimate.
                    </p>
                    <p className="mt-1 text-[11px] text-[#64748B]">
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
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#2F6FED] focus:ring-2 focus:ring-[#DBEAFE]"
              />
              {forecastDaysError ? <p className="mt-2 text-xs text-[#DC2626]">{forecastDaysError}</p> : null}
            </div>

            <div className="mt-4 lg:mt-0">
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                Minimum Safety Stock Per SKU
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
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#2F6FED] focus:ring-2 focus:ring-[#DBEAFE]"
              />
            </div>

            <div className="mt-4 flex items-end lg:mt-0">
              <Button
                className="!h-11 !w-auto min-w-[196px] px-5 !rounded-lg !border-0 !bg-[#2F6FED] !text-white !shadow-none hover:!bg-[#1F5AE0]"
                disabled={forecastGenerating || !shop || !inventorySynced || !salesSynced}
                onClick={
                  forecastGenerating || !shop || !inventorySynced || !salesSynced
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

        <div className="mt-5 flex items-center justify-between">
          <div className="text-sm text-[#64748B]">
            Sales sync status: <span className="font-medium text-[#0F172A]">{salesStatus === "synced" ? "Confirmed" : "Pending"}</span>
          </div>
          {salesMessage ? <p className="text-xs text-[#64748B]">{salesMessage}</p> : null}
        </div>
        {forecastMessage ? <p className="mt-3 text-xs text-[#64748B]">{forecastMessage}</p> : null}
      </Card>

      <Card className="!rounded-[14px] !border-[#E6EAF0] !bg-white p-7 !shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F1FD] text-[#197FE6]">
            <Bell size={18} />
          </span>
          <h2 className="text-lg font-semibold text-[#0F172A]">Notification Preferences</h2>
        </div>
        <div className="mt-6 flex flex-col gap-1">
          <p className="text-sm text-[#64748B]">Control how Merchy notifies your team about forecast changes and stock updates.</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4 border-b border-[#F1F3F6] py-3">
            <div>
              <p className="text-sm font-medium text-[#111827]">Low stock alerts</p>
              <p className="mt-1 text-sm text-[#6B7280]">Notify when stock is below threshold</p>
            </div>
            <button
              type="button"
              aria-pressed={lowStockAlerts}
              onClick={() => setLowStockAlerts((prev) => !prev)}
              className={`relative h-7 w-14 rounded-full transition-colors ${
                lowStockAlerts ? "bg-[#197FE6]" : "bg-[#DCE5F1]"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  lowStockAlerts ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-[#F1F3F6] py-3">
            <div>
              <p className="text-sm font-medium text-[#111827]">Daily summary report</p>
              <p className="mt-1 text-sm text-[#6B7280]">Email digest of inventory status</p>
            </div>
            <button
              type="button"
              aria-pressed={dailySummaryReport}
              onClick={() => setDailySummaryReport((prev) => !prev)}
              className={`relative h-7 w-14 rounded-full transition-colors ${
                dailySummaryReport ? "bg-[#197FE6]" : "bg-[#DCE5F1]"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  dailySummaryReport ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WorkflowPanel;

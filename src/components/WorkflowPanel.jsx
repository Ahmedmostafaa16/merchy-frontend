import { useState } from "react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import PillChip from "./ui/PillChip";

const WorkflowPanel = ({
  salesPeriods,
  activePeriod,
  handlePresetPeriodClick,
  startDate,
  endDate,
  setActivePeriod,
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
    <div className="w-full space-y-6">
      <Card className="!rounded-xl !border-[#E2E8F0] !bg-white p-6 !shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-[#0F172A]">Forecast Settings</h2>
          <p className="text-sm leading-6 text-[#64748B]">
            Set the parameters for the inventory forecast generator. These values determine the historical data used and the logic for restock recommendations.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0F172A]">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setActivePeriod("");
                setStartDate(event.target.value);
                setSalesMessage("");
              }}
              className="h-11 w-full rounded-xl border border-[#D7DFEA] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#197FE6] focus:ring-2 focus:ring-[#BFDBFE]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0F172A]">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                setActivePeriod("");
                setEndDate(event.target.value);
                setSalesMessage("");
              }}
              className="h-11 w-full rounded-xl border border-[#D7DFEA] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#197FE6] focus:ring-2 focus:ring-[#BFDBFE]"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="!h-11 !w-full !rounded-xl !border-[#D7DFEA] !bg-[#F8FAFC] !text-[#334155] !shadow-none hover:!bg-[#F1F5F9]"
              disabled={salesSyncing || !shop || !startDate || !endDate || !inventorySynced}
              onClick={salesSyncing || !shop || !startDate || !endDate || !inventorySynced ? undefined : handleSyncSales}
            >
              {salesSyncing ? "Confirming..." : "Confirm Dates"}
            </Button>
          </div>
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

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
          <div>
            <div className="relative" ref={daysHelpRef}>
              <div className="mb-2 flex items-center gap-2">
                <label className="text-sm font-medium text-[#0F172A]">Forecast Horizon (Days)</label>
                <button
                  type="button"
                  aria-label="How number of days works"
                  onClick={() => setShowDaysHelp((prev) => !prev)}
                  className="text-[11px] font-medium text-[#197FE6] transition-colors hover:text-[#1568BD]"
                >
                  How it works
                </button>
              </div>
              {showDaysHelp ? (
                <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[320px] max-w-[calc(100vw-3rem)] rounded-xl border border-[#D7DFEA] bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
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
              className="h-11 w-full rounded-xl border border-[#D7DFEA] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#197FE6] focus:ring-2 focus:ring-[#BFDBFE]"
            />
            {forecastDaysError ? <p className="mt-2 text-xs text-[#DC2626]">{forecastDaysError}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0F172A]">Minimum Safety Stock per SKU</label>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Enter minimum restock value per sku"
              step={1}
              value={minimumValue}
              onKeyDown={blockInvalidNumberKeys}
              onChange={(event) => handlePositiveIntegerInput(event.target.value, setMinimumValue)}
              className="h-11 w-full rounded-xl border border-[#D7DFEA] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#197FE6] focus:ring-2 focus:ring-[#BFDBFE]"
            />
          </div>
          <div className="flex items-end">
            <Button
              className="!h-11 !w-full !rounded-xl !border-[#197FE6] !bg-[#197FE6] !text-white !shadow-none hover:!bg-[#1568BD]"
              disabled={forecastGenerating || !shop || !inventorySynced || !salesSynced}
              onClick={
                forecastGenerating || !shop || !inventorySynced || !salesSynced
                  ? undefined
                  : handleGenerateForecast
              }
            >
              {forecastGenerating ? "Generating..." : "Generate Forecast"}
            </Button>
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

      <Card className="!rounded-xl !border-[#E2E8F0] !bg-white p-6 !shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[#0F172A]">Notification Preferences</h2>
          <p className="text-sm text-[#64748B]">Control how Merchy notifies your team about forecast changes and stock updates.</p>
        </div>

        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Low stock alerts</p>
              <p className="mt-1 text-sm text-[#64748B]">Get notified when forecasted demand is likely to outpace available inventory.</p>
            </div>
            <button
              type="button"
              aria-pressed={lowStockAlerts}
              onClick={() => setLowStockAlerts((prev) => !prev)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                lowStockAlerts ? "bg-[#197FE6]" : "bg-[#CBD5E1]"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  lowStockAlerts ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[#E2E8F0] pt-5">
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Daily summary report</p>
              <p className="mt-1 text-sm text-[#64748B]">Receive a daily digest with the latest forecast updates and sync activity.</p>
            </div>
            <button
              type="button"
              aria-pressed={dailySummaryReport}
              onClick={() => setDailySummaryReport((prev) => !prev)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                dailySummaryReport ? "bg-[#197FE6]" : "bg-[#CBD5E1]"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  dailySummaryReport ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          />
        </div>
      </Card>
    </div>
  );
};

export default WorkflowPanel;

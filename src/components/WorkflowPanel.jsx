import Button from "./ui/Button";
import Card from "./ui/Card";
import PillChip from "./ui/PillChip";

const WorkflowPanel = ({
  salesPeriods,
  inventoryStatus,
  inventorySyncing,
  inventoryMessage,
  handleSyncInventory,
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
  forecastScope,
  setForecastScope,
  itemSearchBoxRef,
  itemSearchQuery,
  setItemSearchQuery,
  setItemSearchFocused,
  itemSearchError,
  itemSearchFocused,
  itemSearchLoading,
  itemSearchResults,
  resolveItemId,
  resolveItemLabel,
  selectedItems,
  toggleSelectedItem,
  removeSelectedItem,
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
    <div className="mx-auto w-full max-w-[360px] space-y-5">
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
                  <div className="h-8 w-full rounded-lg bg-white/5" />
                  <div className="h-8 w-full rounded-lg bg-white/5" />
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

        <div className="relative mt-5" ref={daysHelpRef}>
          <div className="mb-2 flex items-center gap-2">
            <label className="field-label">Number of days</label>
            <button
              type="button"
              aria-label="How number of days works"
              onClick={() => setShowDaysHelp((prev) => !prev)}
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-white/15 text-[11px] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
              ?
            </button>
          </div>
          {showDaysHelp ? (
            <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[320px] max-w-[calc(100vw-3rem)] rounded-xl border border-white/15 bg-[#0f1528] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <div className="mb-1 flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[#e7ecff]">How long should this stock last?</p>
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
            className="dashboard-input h-11 w-full rounded-xl px-3"
          />
          {forecastDaysError ? <p className="panel-message mt-2">{forecastDaysError}</p> : null}
        </div>
        <div className="mt-4">
          <label className="field-label mb-2 block">Minimum Restock Value</label>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            placeholder="Enter minimum restock value per sku"
            step={1}
            value={minimumValue}
            onKeyDown={blockInvalidNumberKeys}
            onChange={(event) => handlePositiveIntegerInput(event.target.value, setMinimumValue)}
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
  );
};

export default WorkflowPanel;

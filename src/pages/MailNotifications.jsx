import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { apiClient } from "../lib/apiClient";
import "../styles/dashboard.css";

const MailNotifications = ({
  notifications,
  notificationsError = "",
  locationPreferences,
  locationPreferencesError = "",
  onNotificationSaved,
  onLocationPreferencesSaved,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnboarding = notifications?.exists === false || locationPreferences?.exists === false;
  const [reportEmail, setReportEmail] = useState("");
  const [coverageThreshold, setCoverageThreshold] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const showEmptyMessage = !notificationsError && !locationPreferencesError && isOnboarding;

  useEffect(() => {
    setReportEmail(notifications?.email || "");
    setCoverageThreshold(
      notifications?.threshold_days !== null && notifications?.threshold_days !== undefined
        ? String(notifications.threshold_days)
        : ""
    );
  }, [notifications]);

  useEffect(() => {
    setSelectedLocationIds(
      Array.isArray(locationPreferences?.location_ids)
        ? locationPreferences.location_ids.map((locationId) => Number(locationId)).filter(Number.isFinite)
        : []
    );
  }, [locationPreferences]);

  useEffect(() => {
    let ignore = false;

    const loadLocations = async () => {
      setLocationsLoading(true);
      setFormError("");

      try {
        const payload = await apiClient.get("/locations");
        if (ignore) return;
        setLocations(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if (ignore) return;
        setLocations([]);
        setFormError(
          requestError?.status >= 500
            ? "Something went wrong. Please try again."
            : (requestError?.message || "Unable to load inventory locations.")
        );
      } finally {
        if (!ignore) {
          setLocationsLoading(false);
        }
      }
    };

    loadLocations();

    return () => {
      ignore = true;
    };
  }, []);

  const lastSyncLabel = useMemo(() => {
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

  const handleSave = async () => {
    setFormError("");
    setSuccessMessage("");

    const trimmedEmail = reportEmail.trim();
    const threshold = Number(coverageThreshold);

    if (!trimmedEmail || !Number.isFinite(threshold) || threshold <= 0) {
      setFormError("Enter a valid email and coverage threshold.");
      return;
    }

    if (selectedLocationIds.length === 0) {
      setFormError("Select at least one inventory location.");
      return;
    }

    setSaving(true);

    try {
      await apiClient.post("/notifications", {
        body: {
          email: trimmedEmail,
          threshold_days: threshold,
        },
      });

      await apiClient.post("/locations/preferences", {
        body: {
          location_ids: selectedLocationIds,
        },
      });

      onNotificationSaved?.({
        email: trimmedEmail,
        threshold_days: threshold,
      });
      onLocationPreferencesSaved?.(selectedLocationIds);

      setSuccessMessage("Setup saved successfully.");

      if (isOnboarding) {
        window.setTimeout(() => {
          navigate(`/overview${location.search}`);
        }, 500);
        return;
      }

      setSuccessMessage("Notification settings saved successfully.");
    } catch (requestError) {
      setFormError(
        requestError?.status >= 500
          ? "Something went wrong. Please try again."
          : (requestError?.message || "Unable to save notification settings.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLocation = (locationId) => {
    setFormError("");
    setSuccessMessage("");

    setSelectedLocationIds((currentIds) => (
      currentIds.includes(locationId)
        ? currentIds.filter((currentId) => currentId !== locationId)
        : [...currentIds, locationId]
    ));
  };

  return (
    <div className="dashboard-page min-h-screen">
      <main className={`mx-auto max-w-[1320px] px-8 py-8 font-sans ${isOnboarding ? "flex min-h-screen items-center justify-center" : ""}`}>
        <div className={`grid w-full ${isOnboarding ? "" : "gap-6 lg:grid-cols-[240px_minmax(0,1fr)]"}`}>
          {!isOnboarding ? <Sidebar settingsEmail={notifications?.email || ""} /> : null}

          <div className={isOnboarding ? "mx-auto w-full max-w-[720px]" : "space-y-8"}>
            <div className="w-full pt-2">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-[30px] font-bold leading-tight text-white">
                      {isOnboarding ? "Set Up Notifications" : "Settings"}
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                      Configure email alerts for inventory coverage thresholds.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-[10px] py-[6px] text-[13px] font-medium text-zinc-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                    <span>Last synced: {lastSyncLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {notificationsError ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {notificationsError}
              </div>
            ) : null}

            {locationPreferencesError ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {locationPreferencesError}
              </div>
            ) : null}

            {showEmptyMessage ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                Complete setup to start generating location-aware inventory forecasts.
              </div>
            ) : null}

            {formError ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            <Card className="dashboard-panel p-7">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#197FE6] text-white">
                  <Mail size={18} />
                </span>
                <h2 className="text-lg font-semibold text-white">Mail Notifications</h2>
              </div>

              <div className="mt-6 rounded-[14px] border border-white/10 bg-white/5 p-7">
                <p className="text-sm leading-6 text-zinc-400">
                  Configure weekly inventory alerts when items fall below a certain coverage threshold.
                </p>

                <div className="mt-8 space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">
                      Report Email
                    </label>
                    <input
                      type="email"
                      value={reportEmail}
                      onChange={(event) => setReportEmail(event.target.value)}
                      placeholder="ops@brand.com"
                      className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">
                      Coverage Threshold (days)
                    </label>
                    <input
                      type="number"
                      value={coverageThreshold}
                      onChange={(event) => setCoverageThreshold(event.target.value)}
                      placeholder="7"
                      className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
                    />
                  </div>

                  <div className="rounded-[14px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#197FE6] text-white">
                        <MapPin size={16} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Select Inventory Locations</h3>
                        <p className="mt-1 text-xs text-zinc-400">Choose at least one location for forecasting.</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      {locationsLoading ? (
                        <p className="text-sm text-zinc-400">Loading locations...</p>
                      ) : null}

                      {!locationsLoading && locations.length === 0 ? (
                        <p className="text-sm text-zinc-400">No inventory locations found.</p>
                      ) : null}

                      {!locationsLoading && locations.map((inventoryLocation) => {
                        const locationId = Number(inventoryLocation?.id);
                        if (!Number.isFinite(locationId)) return null;
                        return (
                          <label
                            key={locationId}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-[#0f1528]/60 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLocationIds.includes(locationId)}
                              onChange={() => handleToggleLocation(locationId)}
                              className="h-4 w-4 rounded border border-white/20 bg-transparent accent-[#2F6FED]"
                            />
                            <span>{inventoryLocation?.name || "Unnamed Location"}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      className="!m-0 !flex !h-11 !w-full max-w-[280px] !items-center !justify-center px-5 !rounded-lg !border-0 !bg-[#2F6FED] !text-white !shadow-none hover:!bg-[#1F5AE0]"
                      disabled={saving || locationsLoading}
                      onClick={handleSave}
                    >
                      {saving ? "Saving..." : isOnboarding ? "Continue" : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MailNotifications;

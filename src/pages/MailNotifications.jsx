import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getFreshSessionToken } from "../shopify/getToken";
import "../styles/dashboard.css";

const API_BASE = "https://merchyapp-backend.up.railway.app";

const MailNotifications = () => {
  const [reportEmail, setReportEmail] = useState("");
  const [coverageThreshold, setCoverageThreshold] = useState("");

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
    console.log("BUTTON CLICKED");
    console.log("CLICKED");

    if (!reportEmail || Number(coverageThreshold) <= 0) {
      console.error("Invalid input");
      return;
    }

    try {
      const token = await getFreshSessionToken();
      console.log("TOKEN:", token);
      console.log("TOKEN RECEIVED");
      console.log("SENDING REQUEST...");

      const response = await fetch(`${API_BASE}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: reportEmail,
          threshold_days: Number(coverageThreshold),
        }),
      });
      console.log("STATUS:", response.status);
      console.log("RESPONSE STATUS:", response.status);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      console.log("Notification saved");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="dashboard-page min-h-screen">
      <main className="mx-auto max-w-[1320px] px-8 py-8 font-sans">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Sidebar />

          <div className="space-y-8">
            <div className="w-full pt-2">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-[30px] font-bold leading-tight text-white">Mail Notifications</h1>
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

            <Card className="dashboard-panel p-7">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#197FE6] text-white">
                  <Mail size={18} />
                </span>
                <h2 className="text-lg font-semibold text-white">Mail Notifications</h2>
              </div>

              <div className="mt-6 rounded-[14px] border border-white/10 bg-white/5 p-7">
                <p className="text-sm leading-6 text-zinc-400">
                  Configure weekly inventory alerts when items fall below a certain lifetime coverage.
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

                  <div className="pt-2">
                    <Button
                      className="!m-0 !flex !h-11 !w-full max-w-[280px] !items-center !justify-center px-5 !rounded-lg !border-0 !bg-[#2F6FED] !text-white !shadow-none hover:!bg-[#1F5AE0]"
                      onClick={handleSave}
                    >
                      Save Notification Settings
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

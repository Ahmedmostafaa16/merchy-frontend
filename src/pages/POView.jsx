import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { apiClient } from "../lib/apiClient";
import "../styles/dashboard.css";

const formatCurrency = (value, currency = "EGP") => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "-";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusBadgeClasses = {
  draft: "bg-zinc-500/20 text-zinc-300 border border-zinc-500/40",
  confirmed: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  ordered: "bg-orange-500/20 text-orange-300 border border-orange-500/40",
  delivered: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
};

const POView = ({ settingsEmail = "" }) => {
  const { poId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadPo = async () => {
      setLoading(true);
      setError("");

      try {
        const payload = await apiClient.get(`/po/${encodeURIComponent(poId)}`);
        if (ignore) return;
        setPo(payload || null);
      } catch (requestError) {
        if (ignore) return;
        setPo(null);
        setError(requestError?.message || "Unable to load purchase order.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadPo();

    return () => {
      ignore = true;
    };
  }, [poId]);

  const items = useMemo(() => (
    Array.isArray(po?.items) ? po.items : []
  ), [po?.items]);
  const currency = po?.currency || "EGP";
  const computedTotal = useMemo(() => (
    items.reduce((sum, item) => sum + (Number(item?.total_price ?? item?.totalPrice) || 0), 0)
  ), [items]);
  const total = po?.total_cost ?? po?.totalCost ?? computedTotal;
  const status = String(po?.status || "draft");

  return (
    <div className="dashboard-page min-h-screen">
      <main className="w-full px-8 py-8 font-sans">
        <div className="flex w-full items-start gap-6">
          <Sidebar settingsEmail={settingsEmail} />

          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
              <div>
                <h1 className="text-[30px] font-bold leading-tight text-white">Purchase Order</h1>
                <p className="mt-2 text-sm text-zinc-400">Read-only invoice view for this purchase order.</p>
              </div>
              <Button
                variant="secondary"
                className="!h-10 !w-auto px-4"
                onClick={() => navigate(`/po${location.search}`)}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Purchase Orders
              </Button>
            </div>

            {loading ? (
              <Card className="dashboard-panel p-6 text-zinc-300">Loading purchase order...</Card>
            ) : null}

            {!loading && error ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {!loading && !error && po ? (
              <Card className="dashboard-panel w-full p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#197FE6] text-white">
                        <ClipboardList size={18} />
                      </span>
                      <h2 className="text-xl font-semibold text-white">Invoice</h2>
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">PO ID: <span className="text-zinc-200">{po?.id || "-"}</span></p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[status] || statusBadgeClasses.draft}`}>
                    {status}
                  </span>
                </div>

                <div className="grid gap-4 border-b border-white/10 py-6 md:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Supplier</p>
                    <p className="mt-2 text-sm font-medium text-white">{po?.supplier_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Created</p>
                    <p className="mt-2 text-sm font-medium text-white">{formatDate(po?.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Due Date</p>
                    <p className="mt-2 text-sm font-medium text-white">{formatDate(po?.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Total</p>
                    <p className="mt-2 text-sm font-medium text-white">{formatCurrency(total, currency)}</p>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[860px] text-left text-sm text-zinc-400">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Product / Variant</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Unit Price</th>
                        <th className="px-4 py-3">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item?.id || item?.sku} className="border-t border-white/10">
                          <td className="px-4 py-3">{item?.sku || "-"}</td>
                          <td className="px-4 py-3 text-zinc-200">{item?.title || "-"}</td>
                          <td className="px-4 py-3">{item?.quantity ?? "-"}</td>
                          <td className="px-4 py-3">{formatCurrency(item?.unit_price, currency)}</td>
                          <td className="px-4 py-3 text-zinc-200">{formatCurrency(item?.total_price, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default POView;

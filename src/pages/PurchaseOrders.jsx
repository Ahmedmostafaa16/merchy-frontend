import { useEffect, useRef, useState } from "react";
import { ClipboardList, Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { apiClient } from "../lib/apiClient";
import "../styles/dashboard.css";

const statusOptions = ["draft", "confirmed", "ordered", "delivered"];
const PO_CACHE_TTL_MS = 5 * 60 * 1000;

const statusBadgeClasses = {
  draft: "bg-zinc-500/20 text-zinc-300 border border-zinc-500/40",
  confirmed: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  ordered: "bg-orange-500/20 text-orange-300 border border-orange-500/40",
  delivered: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
};

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

const buildPoCacheKey = (shopDomain, statusFilter) => `po_cache::${shopDomain || "unknown"}::${statusFilter || "all"}`;

const readPoCache = (cacheKey) => {
  try {
    const rawValue = window.localStorage.getItem(cacheKey);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    if (!parsed || !Array.isArray(parsed.data) || !Number.isFinite(Number(parsed.timestamp))) {
      return null;
    }

    const timestamp = Number(parsed.timestamp);
    if ((Date.now() - timestamp) >= PO_CACHE_TTL_MS) {
      return null;
    }

    return parsed.data;
  } catch (_error) {
    return null;
  }
};

const writePoCache = (cacheKey, data) => {
  window.localStorage.setItem(cacheKey, JSON.stringify({
    timestamp: Date.now(),
    data,
  }));
};

const PurchaseOrders = ({ settingsEmail = "" }) => {
  const location = useLocation();
  const fetchGuardRef = useRef("");
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [empty, setEmpty] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState("");
  const shopDomain = new URLSearchParams(location.search).get("shop") || "";

  useEffect(() => {
    let ignore = false;
    const cacheKey = buildPoCacheKey(shopDomain, selectedStatusFilter);
    const requestKey = `${shopDomain}::${selectedStatusFilter}`;

    if (fetchGuardRef.current === requestKey) {
      return () => {
        ignore = true;
      };
    }

    const cachedPos = readPoCache(cacheKey);
    if (cachedPos) {
      setPos(cachedPos);
      setEmpty(cachedPos.length === 0);
      setLoading(false);
      setError("");
      return () => {
        ignore = true;
      };
    }

    const loadPos = async () => {
      fetchGuardRef.current = requestKey;
      setLoading(true);
      setError("");

      try {
        const query = selectedStatusFilter === "all"
          ? { shop: shopDomain }
          : { shop: shopDomain, status: selectedStatusFilter };
        const payload = await apiClient.get("/po", { query });
        if (ignore) return;
        const rows = Array.isArray(payload) ? payload : [];
        setPos(rows);
        setEmpty(rows.length === 0);
        writePoCache(cacheKey, rows);
      } catch (requestError) {
        if (ignore) return;
        setPos([]);
        if (requestError?.isEmpty || [400, 404].includes(requestError?.status)) {
          setEmpty(true);
          setError("");
        } else {
          setEmpty(false);
          setError("Something went wrong. Please try again.");
        }
      } finally {
        fetchGuardRef.current = "";
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadPos();

    return () => {
      ignore = true;
    };
  }, [selectedStatusFilter, shopDomain]);

  const handleStatusChange = async (poId, nextStatus) => {
    const currentPo = pos.find((po) => po?.id === poId);
    const previousStatus = currentPo?.status;
    const previousPos = pos;
    const nextPos = pos.map((po) => (
      po?.id === poId ? { ...po, status: nextStatus } : po
    ));

    setError("");
    setUpdatingStatusId(poId);
    setPos(nextPos);
    writePoCache(buildPoCacheKey(shopDomain, selectedStatusFilter), nextPos);

    try {
      await apiClient.patch(`/po/${encodeURIComponent(poId)}/status`, {
        query: {
          shop: shopDomain,
        },
        body: { status: nextStatus },
      });
    } catch (requestError) {
      const revertedPos = previousPos.map((po) => (
        po?.id === poId ? { ...po, status: previousStatus } : po
      ));
      setPos(revertedPos);
      writePoCache(buildPoCacheKey(shopDomain, selectedStatusFilter), revertedPos);
      setError(requestError?.message || "Unable to update purchase order status.");
    } finally {
      setUpdatingStatusId("");
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;

    const poId = pendingDeleteId;
    const nextPos = pos.filter((po) => po?.id !== poId);
    setDeletingId(poId);
    setError("");

    try {
      await apiClient.delete(`/po/${encodeURIComponent(poId)}`, {
        query: {
          shop: shopDomain,
        },
      });
      setPos(nextPos);
      writePoCache(buildPoCacheKey(shopDomain, selectedStatusFilter), nextPos);
      setPendingDeleteId(null);
    } catch (requestError) {
      setError(requestError?.message || "Unable to delete purchase order.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="dashboard-page min-h-screen">
      <main className="mx-auto max-w-[1320px] px-8 py-8 font-sans">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Sidebar settingsEmail={settingsEmail} />

          <div className="space-y-6">
            <div className="flex flex-col gap-6 pt-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-[30px] font-bold leading-tight text-white">Purchase Orders</h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    Review all purchase orders, update statuses, and remove outdated records.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-zinc-400" htmlFor="po-status-filter">Filter</label>
                  <select
                    id="po-status-filter"
                    value={selectedStatusFilter}
                    onChange={(event) => setSelectedStatusFilter(event.target.value)}
                    className="dashboard-input h-11 min-w-[180px] rounded-lg px-3 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="draft">draft</option>
                    <option value="confirmed">confirmed</option>
                    <option value="ordered">ordered</option>
                    <option value="delivered">delivered</option>
                  </select>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error?.message || error?.detail || JSON.stringify(error)}
              </div>
            ) : null}

            <Card className="dashboard-panel p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#197FE6] text-white">
                  <ClipboardList size={18} />
                </span>
                <h2 className="text-lg font-semibold text-white">PO Dashboard</h2>
              </div>

              {loading ? (
                <div className="mt-6 rounded-xl border border-white/10 px-4 py-6 text-zinc-300">
                  Loading purchase orders...
                </div>
              ) : null}

              {!loading && error ? (
                <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error?.message || error?.detail || JSON.stringify(error)}
                </div>
              ) : null}

              {!loading && !error && empty ? (
                <div className="mt-6">
                  <EmptyState />
                </div>
              ) : null}

              {!loading && !error && !empty ? (
              <div className="mt-6 max-h-[620px] overflow-y-auto overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[1080px] text-left text-sm text-zinc-400">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-zinc-400">PO ID</th>
                      <th className="px-4 py-3 text-zinc-400">Supplier Name</th>
                      <th className="px-4 py-3 text-zinc-400">Status</th>
                      <th className="px-4 py-3 text-zinc-400">Total Cost</th>
                      <th className="px-4 py-3 text-zinc-400">Due Date</th>
                      <th className="px-4 py-3 text-zinc-400">Created At</th>
                      <th className="px-4 py-3 text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos.map((po) => {
                      const poId = String(po?.id || "");
                      const currentStatus = String(po?.status || "draft");
                      return (
                        <tr key={poId} className="border-t border-white/10 text-zinc-400">
                          <td className="px-4 py-4 text-zinc-200">{poId ? poId.slice(0, 6) : "-"}</td>
                          <td className="px-4 py-4">{po?.supplier_name || po?.supplierName || "-"}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadgeClasses[currentStatus] || statusBadgeClasses.draft}`}>
                              {currentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {formatCurrency(po?.total_cost ?? po?.totalCost, po?.currency || "EGP")}
                          </td>
                          <td className="px-4 py-4">{formatDate(po?.due_date || po?.dueDate)}</td>
                          <td className="px-4 py-4">{formatDate(po?.created_at || po?.createdAt)}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <select
                                value={currentStatus}
                                onChange={(event) => handleStatusChange(poId, event.target.value)}
                                disabled={updatingStatusId === poId}
                                className="dashboard-input h-9 min-w-[148px] rounded-lg px-3 text-xs"
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>

                              <Button
                                variant="secondary"
                                className="!h-9 !w-auto px-3 text-xs"
                                disabled={deletingId === poId}
                                onClick={() => setPendingDeleteId(poId)}
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              ) : null}
            </Card>
          </div>
        </div>
      </main>

      {pendingDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1834] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
            <h3 className="text-lg font-semibold text-white">Delete Purchase Order</h3>
            <p className="mt-3 text-sm text-zinc-400">
              Are you sure you want to delete this PO?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                className="!h-10 !w-auto px-4"
                onClick={() => setPendingDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                className="!h-10 !w-auto px-4"
                disabled={deletingId === pendingDeleteId}
                onClick={handleDelete}
              >
                {deletingId === pendingDeleteId ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PurchaseOrders;

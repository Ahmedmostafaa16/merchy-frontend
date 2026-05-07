import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Eye, Pencil, Search, Trash2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { apiClient } from "../lib/apiClient";
import "../styles/dashboard.css";

const statusOptions = ["draft", "confirmed", "ordered", "delivered"];
const statusFilterOptions = ["all", "draft", "ordered", "received", "delayed", "confirmed", "delivered"];
const PO_CACHE_TTL_MS = 5 * 60 * 1000;

const statusBadgeClasses = {
  draft: "border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]",
  confirmed: "border-[#BFDBFE] bg-[#DBEAFE] text-[#2563EB]",
  ordered: "border-[#BFDBFE] bg-[#DBEAFE] text-[#2563EB]",
  received: "border-[#BBF7D0] bg-[#DCFCE7] text-[#16A34A]",
  delivered: "border-[#BBF7D0] bg-[#DCFCE7] text-[#16A34A]",
  delayed: "border-[#FECACA] bg-[#FEE2E2] text-[#DC2626]",
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

const isOverdueDate = (value) => {
  if (!value) return false;
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return dueDay < startOfToday;
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
  const navigate = useNavigate();
  const fetchGuardRef = useRef("");
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [empty, setEmpty] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState("");
  const shopDomain = new URLSearchParams(location.search).get("shop") || "";

  useEffect(() => {
    let ignore = false;
    const cacheKey = buildPoCacheKey(shopDomain, "all");
    const requestKey = `${shopDomain}::all`;

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
        const payload = await apiClient.get("/po");
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
  }, [shopDomain]);

  const filteredPos = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return pos.filter((po) => {
      const poId = String(po?.id || "").toLowerCase();
      const supplier = String(po?.supplier_name || po?.supplierName || "").toLowerCase();
      const status = String(po?.status || "draft").toLowerCase();
      const matchesSearch = !search || poId.includes(search) || supplier.includes(search) || status.includes(search);
      const matchesStatus = selectedStatusFilter === "all" || status === selectedStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pos, searchQuery, selectedStatusFilter]);

  const poMetrics = useMemo(() => (
    pos.reduce((metrics, po) => {
      const status = String(po?.status || "draft").toLowerCase();
      const totalCost = Number(po?.total_cost ?? po?.totalCost);

      metrics.total += 1;
      if (status === "draft") metrics.draft += 1;
      if (status === "ordered") metrics.ordered += 1;
      if (Number.isFinite(totalCost)) metrics.totalSpend += totalCost;
      return metrics;
    }, {
      total: 0,
      draft: 0,
      ordered: 0,
      totalSpend: 0,
    })
  ), [pos]);

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
    writePoCache(buildPoCacheKey(shopDomain, "all"), nextPos);

    try {
      await apiClient.patch(`/po/${encodeURIComponent(poId)}/status`, {
        body: { status: nextStatus },
      });
    } catch (requestError) {
      const revertedPos = previousPos.map((po) => (
        po?.id === poId ? { ...po, status: previousStatus } : po
      ));
      setPos(revertedPos);
      writePoCache(buildPoCacheKey(shopDomain, "all"), revertedPos);
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
      await apiClient.delete(`/po/${encodeURIComponent(poId)}`);
      setPos(nextPos);
      writePoCache(buildPoCacheKey(shopDomain, "all"), nextPos);
      setPendingDeleteId(null);
    } catch (requestError) {
      setError(requestError?.message || "Unable to delete purchase order.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="dashboard-page min-h-screen">
      <main className="w-full px-8 py-8 font-sans">
        <div className="flex w-full items-start gap-6">
          <Sidebar settingsEmail={settingsEmail} />

          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-col gap-5 pt-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-[30px] font-bold leading-tight text-white">Purchase Orders</h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    Review all purchase orders, update statuses, and remove outdated records.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[240px]">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search PO..."
                      className="dashboard-input h-10 w-full rounded-lg pl-9 pr-9 text-sm"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
                  <label className="text-sm text-zinc-400" htmlFor="po-status-filter">Filter</label>
                  <select
                    id="po-status-filter"
                    value={selectedStatusFilter}
                    onChange={(event) => setSelectedStatusFilter(event.target.value)}
                    className="dashboard-input h-10 min-w-[150px] rounded-lg px-3 text-sm"
                  >
                    {statusFilterOptions.map((option) => (
                      <option key={option} value={option}>{option === "all" ? "All" : option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error?.message || error?.detail || JSON.stringify(error)}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Total POs</p>
                <p className="mt-1 text-xl font-semibold text-white">{poMetrics.total}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Draft</p>
                <p className="mt-1 text-xl font-semibold text-white">{poMetrics.draft}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Ordered</p>
                <p className="mt-1 text-xl font-semibold text-white">{poMetrics.ordered}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Total Spend</p>
                <p className="mt-1 text-xl font-semibold text-white">{formatCurrency(poMetrics.totalSpend)}</p>
              </div>
            </div>

            <Card className="dashboard-panel w-full p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#197FE6] text-white">
                  <ClipboardList size={18} />
                </span>
                <h2 className="text-lg font-semibold text-white">PO Dashboard</h2>
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {filteredPos.length} {filteredPos.length === 1 ? "result" : "results"}
                </span>
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
              <div className="mt-4 max-h-[680px] w-full overflow-y-auto overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[1040px] table-fixed text-left text-xs text-zinc-400">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[14%]" />
                    <col className="w-[11%]" />
                    <col className="w-[16%]" />
                    <col className="w-[15%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-3 py-2.5 text-zinc-400">Supplier</th>
                      <th className="px-3 py-2.5 text-zinc-400">Total Cost</th>
                      <th className="px-3 py-2.5 text-zinc-400">Status</th>
                      <th className="px-3 py-2.5 text-zinc-400">Due Date</th>
                      <th className="px-3 py-2.5 text-zinc-400">Created At</th>
                      <th className="px-3 py-2.5 text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPos.length === 0 ? (
                      <tr className="border-t border-white/10">
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <p className="text-sm font-medium text-white">No matching purchase orders found</p>
                          <p className="mt-1 text-xs text-zinc-400">Try another supplier, PO id, or status.</p>
                        </td>
                      </tr>
                    ) : filteredPos.map((po) => {
                      const poId = String(po?.id || "");
                      const currentStatus = String(po?.status || "draft");
                      const dueDate = po?.due_date || po?.dueDate;
                      const overdue = isOverdueDate(dueDate);
                      return (
                        <tr key={poId} className="border-t border-white/10 text-zinc-400 hover:bg-white/[0.03]">
                          <td className="px-3 py-2.5">
                            <div className="truncate text-sm font-medium text-zinc-200" title={po?.supplier_name || po?.supplierName || ""}>
                              {po?.supplier_name || po?.supplierName || "-"}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-zinc-500" title={poId}>
                              {poId ? `#${poId.slice(0, 8)}` : "-"}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-zinc-200">
                            {formatCurrency(po?.total_cost ?? po?.totalCost, po?.currency || "EGP")}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-4 ${statusBadgeClasses[currentStatus] || statusBadgeClasses.draft}`}>
                              {currentStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className={overdue ? "font-medium text-red-300" : "text-zinc-300"}>
                              {formatDate(dueDate)}
                            </div>
                            {overdue ? (
                              <span className="mt-1 inline-flex rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold leading-4 text-red-300">
                                Overdue
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5">{formatDate(po?.created_at || po?.createdAt)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                aria-label="View purchase order"
                                title="View"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white text-[#374151] transition hover:bg-[#F9FAFB]"
                                onClick={() => navigate(`/po/${encodeURIComponent(poId)}${location.search}`)}
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                type="button"
                                aria-label="Edit purchase order"
                                title="Edit"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white text-[#374151] transition hover:bg-[#F9FAFB]"
                                onClick={() => navigate(`/po/${encodeURIComponent(poId)}/edit${location.search}`)}
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                type="button"
                                aria-label="Delete purchase order"
                                title="Delete"
                                disabled={deletingId === poId}
                                onClick={() => setPendingDeleteId(poId)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#FECACA] bg-[#FEE2E2] text-[#DC2626] transition hover:bg-[#FECACA] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 size={14} />
                              </button>

                              <select
                                value={currentStatus}
                                onChange={(event) => handleStatusChange(poId, event.target.value)}
                                disabled={updatingStatusId === poId}
                                className="dashboard-input h-8 min-w-[118px] rounded-lg px-2 text-xs"
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
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

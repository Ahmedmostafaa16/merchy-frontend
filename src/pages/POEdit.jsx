import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { apiClient } from "../lib/apiClient";
import "../styles/dashboard.css";

const statusOptions = ["draft", "confirmed", "ordered", "delivered"];

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const clearPoCaches = () => {
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith("po_cache::"))
    .forEach((key) => window.localStorage.removeItem(key));
};

const normalizeItem = (item) => ({
  id: item?.id || "",
  sku: String(item?.sku || ""),
  title: String(item?.title || ""),
  quantity: String(item?.quantity ?? ""),
  unit_price: item?.unit_price !== undefined && item?.unit_price !== null ? String(item.unit_price) : "",
});

const POEdit = ({ settingsEmail = "" }) => {
  const { poId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [status, setStatus] = useState("draft");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let ignore = false;

    const loadPo = async () => {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        const payload = await apiClient.get(`/po/${encodeURIComponent(poId)}`);
        if (ignore) return;
        setSupplierName(payload?.supplier_name || "");
        setStatus(payload?.status || "draft");
        setDueDate(toDateInputValue(payload?.due_date));
        setCurrency(payload?.currency || "EGP");
        setItems(Array.isArray(payload?.items) ? payload.items.map(normalizeItem) : []);
      } catch (requestError) {
        if (ignore) return;
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

  const totalCost = useMemo(() => (
    items.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      return sum + ((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0));
    }, 0)
  ), [items]);

  const updateItemField = (index, field, value) => {
    setItems((currentItems) => currentItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
    setError("");
    setSuccessMessage("");
  };

  const handleSave = async () => {
    const normalizedSupplierName = supplierName.trim();
    if (!normalizedSupplierName) {
      setError("Supplier name is required.");
      return;
    }

    const invalidItem = items.find((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      return (
        !Number.isFinite(quantity) ||
        quantity < 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      );
    });

    if (invalidItem) {
      setError("Quantities and unit prices must be 0 or greater.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = await apiClient.patch(`/po/${encodeURIComponent(poId)}`, {
        body: {
          supplier_name: normalizedSupplierName,
          status,
          due_date: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
          currency,
          items: items.map((item) => ({
            id: item.id || undefined,
            sku: item.sku,
            title: item.title,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
          })),
        },
      });
      clearPoCaches();
      setSupplierName(payload?.supplier_name || normalizedSupplierName);
      setStatus(payload?.status || status);
      setDueDate(toDateInputValue(payload?.due_date));
      setCurrency(payload?.currency || currency);
      setItems(Array.isArray(payload?.items) ? payload.items.map(normalizeItem) : items);
      setSuccessMessage("Purchase order changes saved.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to save purchase order changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page min-h-screen">
      <main className="w-full px-8 py-8 font-sans">
        <div className="flex w-full items-start gap-6">
          <Sidebar settingsEmail={settingsEmail} />

          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
              <div>
                <h1 className="text-[30px] font-bold leading-tight text-white">Edit Purchase Order</h1>
                <p className="mt-2 text-sm text-zinc-400">Review PO details and update status using the existing backend endpoint.</p>
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

            {error ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            <Card className="dashboard-panel w-full p-6">
              {loading ? (
                <div className="rounded-xl border border-white/10 px-4 py-6 text-zinc-300">Loading purchase order...</div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">Supplier Name</label>
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(event) => {
                          setSupplierName(event.target.value);
                          setError("");
                          setSuccessMessage("");
                        }}
                        className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">Status</label>
                      <select
                        value={status}
                        onChange={(event) => {
                          setStatus(event.target.value);
                          setSuccessMessage("");
                        }}
                        className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(event) => {
                          setDueDate(event.target.value);
                          setSuccessMessage("");
                        }}
                        className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">Total Cost</label>
                      <input
                        type="text"
                        value={`$${totalCost.toFixed(2)}`}
                        readOnly
                        className="dashboard-input h-11 w-full rounded-lg px-3 text-sm opacity-80"
                      />
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[920px] text-left text-sm text-zinc-400">
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
                        {items.map((item, index) => {
                          const quantity = Number(item.quantity);
                          const unitPrice = Number(item.unit_price);
                          const total = (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);

                          return (
                            <tr key={item.id || item.sku || index} className="border-t border-white/10">
                              <td className="px-4 py-3">{item.sku || "-"}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={item.title}
                                  readOnly
                                  className="dashboard-input h-10 w-full min-w-[220px] rounded-lg px-3 text-sm opacity-80"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(event) => updateItemField(index, "quantity", event.target.value)}
                                  className="dashboard-input h-10 w-full min-w-[110px] rounded-lg px-3 text-sm"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(event) => updateItemField(index, "unit_price", event.target.value)}
                                  className="dashboard-input h-10 w-full min-w-[130px] rounded-lg px-3 text-sm"
                                />
                              </td>
                              <td className="px-4 py-3 text-zinc-200">${total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                    <Button
                      variant="secondary"
                      className="!h-11 !w-auto px-5"
                      onClick={() => navigate(`/po/${encodeURIComponent(poId)}${location.search}`)}
                    >
                      View
                    </Button>
                    <Button
                      className="!h-11 !w-auto px-5"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      <Save size={16} className="mr-2" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default POEdit;

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { apiClient } from "../lib/apiClient";
import "../styles/dashboard.css";

const PO_SELECTION_STORAGE_KEY = "po_builder_selected_items";
const buildPoItemKey = (item) => `${item?.sku || ""}::${item?.title || ""}::${item?.size || ""}`;

const normalizeSelectedItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && (item.sku || item.title))
    .map((item) => ({
      sku: String(item.sku || ""),
      title: String(item.title || ""),
      size: String(item.size || ""),
      quantity: String(Number(item.quantity) > 0 ? Number(item.quantity) : ""),
      unit_price: item.unit_price !== undefined && item.unit_price !== null ? String(item.unit_price) : "",
    }));
};

const readStoredPoItems = () => {
  try {
    const rawValue = window.localStorage.getItem(PO_SELECTION_STORAGE_KEY);
    return rawValue ? normalizeSelectedItems(JSON.parse(rawValue)) : [];
  } catch (_error) {
    return [];
  }
};

const POBuilder = ({ settingsEmail = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedItemsFromState = location.state?.selectedItems;

  const [items, setItems] = useState(() => (
    normalizeSelectedItems(selectedItemsFromState).length > 0
      ? normalizeSelectedItems(selectedItemsFromState)
      : readStoredPoItems()
  ));
  const [supplierName, setSupplierName] = useState("");
  const [status, setStatus] = useState("draft");
  const [dueDate, setDueDate] = useState("");
  const [supplierError, setSupplierError] = useState("");
  const [itemsError, setItemsError] = useState("");
  const [rowErrors, setRowErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const normalizedFromState = normalizeSelectedItems(selectedItemsFromState);
    if (normalizedFromState.length === 0) return;

    setItems(normalizedFromState);
    window.localStorage.setItem(PO_SELECTION_STORAGE_KEY, JSON.stringify(normalizedFromState));
  }, [selectedItemsFromState]);

  useEffect(() => {
    if (items.length === 0) {
      window.localStorage.removeItem(PO_SELECTION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(PO_SELECTION_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const totalCost = useMemo(() => (
    items.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const rowTotal = (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);
      return sum + rowTotal;
    }, 0)
  ), [items]);

  const updateItemField = (index, field, value) => {
    setItems((currentItems) => currentItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));

    setItemsError("");
    setSubmitError("");
    setRowErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      const key = buildPoItemKey(items[index]);
      if (!nextErrors[key]) return nextErrors;
      nextErrors[key] = {
        ...nextErrors[key],
        [field]: "",
      };
      return nextErrors;
    });
  };

  const validateForm = () => {
    let valid = true;
    const nextRowErrors = {};

    if (!supplierName.trim()) {
      setSupplierError("Supplier name is required.");
      valid = false;
    } else {
      setSupplierError("");
    }

    if (items.length === 0) {
      setItemsError("Select at least one forecast item before saving.");
      valid = false;
    } else {
      setItemsError("");
    }

    items.forEach((item) => {
      const key = buildPoItemKey(item);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const nextErrorsForRow = {};

      if (!Number.isFinite(quantity) || quantity <= 0) {
        nextErrorsForRow.quantity = "Quantity must be greater than 0.";
        valid = false;
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        nextErrorsForRow.unit_price = "Unit price must be 0 or greater.";
        valid = false;
      }

      if (Object.keys(nextErrorsForRow).length > 0) {
        nextRowErrors[key] = nextErrorsForRow;
      }
    });

    setRowErrors(nextRowErrors);

    return valid;
  };

  const handleSavePo = async () => {
    setSuccessMessage("");
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    const payload = {
      supplier_name: supplierName.trim(),
      status,
      due_date: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
      currency: "EGP",
      items: items.map((item) => ({
        sku: item.sku,
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    };

    setSaving(true);

    try {
      await apiClient.post("/po", {
        body: payload,
      });

      setItems([]);
      setSupplierName("");
      setStatus("draft");
      setDueDate("");
      setSupplierError("");
      setItemsError("");
      setRowErrors({});
      setSubmitError("");
      setSuccessMessage("Purchase order saved successfully.");
      window.localStorage.removeItem(PO_SELECTION_STORAGE_KEY);
    } catch (error) {
      setSubmitError(error?.message || "Unable to save purchase order.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackToForecast = () => {
    navigate(`/raw-data${location.search}`);
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
                  <h1 className="text-[30px] font-bold leading-tight text-white">Create Purchase Order</h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    Review forecast items, adjust costs, and save the final PO when it is ready.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  className="!h-10 !w-auto px-4"
                  onClick={handleBackToForecast}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Forecast
                </Button>
              </div>
            </div>

            {submitError ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {submitError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            <Card className="dashboard-panel p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#197FE6] text-white">
                  <PackageCheck size={18} />
                </span>
                <h2 className="text-lg font-semibold text-white">PO Builder</h2>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(event) => {
                      setSupplierName(event.target.value);
                      setSupplierError("");
                      setSubmitError("");
                    }}
                    placeholder="Supplier name"
                    className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
                  />
                  {supplierError ? <p className="text-xs text-red-300">{supplierError}</p> : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
                  >
                    <option value="draft">draft</option>
                    <option value="confirmed">confirmed</option>
                    <option value="ordered">ordered</option>
                    <option value="delivered">delivered</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="mb-2 block text-[13px] font-medium text-[#9CA3AF]">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="dashboard-input h-11 w-full rounded-lg px-3 text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-[14px] border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Selected forecast items</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Quantities and unit prices stay local until you click Save PO.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                    Total Cost: EGP {totalCost.toFixed(2)}
                  </div>
                </div>

                {itemsError ? <p className="mb-3 text-xs text-red-300">{itemsError}</p> : null}

                <div className="max-h-[430px] overflow-y-auto overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[980px] text-left text-sm text-zinc-400">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-zinc-400">SKU</th>
                        <th className="px-4 py-3 text-zinc-400">Title</th>
                        <th className="px-4 py-3 text-zinc-400">Size</th>
                        <th className="px-4 py-3 text-zinc-400">Quantity</th>
                        <th className="px-4 py-3 text-zinc-400">Unit Price</th>
                        <th className="px-4 py-3 text-zinc-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td className="px-4 py-3 text-zinc-400" colSpan={6}>
                            No forecast rows selected yet.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => {
                          const itemKey = buildPoItemKey(item);
                          const quantityError = rowErrors[itemKey]?.quantity;
                          const unitPriceError = rowErrors[itemKey]?.unit_price;
                          const quantity = Number(item.quantity);
                          const unitPrice = Number(item.unit_price);
                          const total = (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);

                          return (
                            <tr key={itemKey} className="border-t border-white/10 text-zinc-400">
                              <td className="px-4 py-3 text-zinc-400">{item.sku || "-"}</td>
                              <td className="px-4 py-3 text-zinc-400">{item.title || "-"}</td>
                              <td className="px-4 py-3 text-zinc-400">{item.size || "-"}</td>
                              <td className="px-4 py-3 align-top">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(event) => updateItemField(index, "quantity", event.target.value)}
                                  className="dashboard-input h-10 w-full min-w-[110px] rounded-lg px-3 text-sm"
                                />
                                {quantityError ? <p className="mt-2 text-xs text-red-300">{quantityError}</p> : null}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(event) => updateItemField(index, "unit_price", event.target.value)}
                                  className="dashboard-input h-10 w-full min-w-[130px] rounded-lg px-3 text-sm"
                                />
                                {unitPriceError ? <p className="mt-2 text-xs text-red-300">{unitPriceError}</p> : null}
                              </td>
                              <td className="px-4 py-3 text-zinc-200">
                                EGP {total.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                  <Button
                    variant="secondary"
                    className="!h-11 !w-auto px-5"
                    onClick={handleBackToForecast}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="!h-11 !w-auto px-5"
                    disabled={saving}
                    onClick={handleSavePo}
                  >
                    {saving ? "Saving..." : "Save PO"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default POBuilder;

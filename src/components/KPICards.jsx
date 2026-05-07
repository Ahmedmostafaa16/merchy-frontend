import { Archive, Boxes, Package, Sparkles } from "lucide-react";
import Card from "./ui/Card";
import KPIStatCard from "./ui/KPIStatCard";

const KPICards = ({
  canShowKpis,
  loadingKpis,
  totalSkus,
  avgSalesPerDay,
  inventoryValue,
  unitsInStock,
  renderKpiValue,
}) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {!canShowKpis ? (
        <Card className="dashboard-panel p-4 sm:col-span-2 lg:col-span-4">
          <p className="panel-note">Inventory is automatically synced when you open the app. Complete Sales Sync to load KPI cards.</p>
        </Card>
      ) : loadingKpis ? (
        <>
          <KPIStatCard label="Total SKUs" icon={Package} iconClassName="bg-sky-100 text-sky-600" />
          <KPIStatCard label="Avg Sales / day" icon={Sparkles} iconClassName="bg-amber-100 text-amber-600" />
          <KPIStatCard label="Inventory Value" icon={Archive} iconClassName="bg-emerald-100 text-emerald-600" />
          <KPIStatCard label="Units in Stock" icon={Boxes} iconClassName="bg-violet-100 text-violet-600" />
        </>
      ) : (
        <>
          <Card className="dashboard-panel p-4">
            <p className="inline-flex items-center gap-2 kpi-label">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                <Package size={15} strokeWidth={1.8} />
              </span>
              <span>Total SKUs</span>
            </p>
            {renderKpiValue(totalSkus)}
          </Card>
          <Card className="dashboard-panel p-4">
            <p className="inline-flex items-center gap-2 kpi-label">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Sparkles size={15} strokeWidth={1.8} />
              </span>
              <span>Avg Sales / day</span>
            </p>
            {renderKpiValue(avgSalesPerDay)}
          </Card>
          <Card className="dashboard-panel p-4">
            <p className="inline-flex items-center gap-2 kpi-label">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Archive size={15} strokeWidth={1.8} />
              </span>
              <span>Inventory Value</span>
            </p>
            {renderKpiValue(inventoryValue, true)}
          </Card>
          <Card className="dashboard-panel p-4">
            <p className="inline-flex items-center gap-2 kpi-label">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <Boxes size={15} strokeWidth={1.8} />
              </span>
              <span>Units in Stock</span>
            </p>
            {renderKpiValue(unitsInStock, true)}
          </Card>
        </>
      )}
    </div>
  );
};

export default KPICards;

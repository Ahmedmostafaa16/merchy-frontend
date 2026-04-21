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
          <KPIStatCard label="Total SKUs" icon={Package} />
          <KPIStatCard label="Avg Sales / day" icon={Sparkles} />
          <KPIStatCard label="Inventory Value" icon={Archive} />
          <KPIStatCard label="Units in Stock" icon={Boxes} />
        </>
      ) : (
        <>
          <Card className="dashboard-panel p-4">
            <p className="inline-flex items-center gap-1.5 kpi-label">
              <Package size={16} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
              <span>Total SKUs</span>
            </p>
            {renderKpiValue(totalSkus)}
          </Card>
          <Card className="dashboard-panel p-4">
            <p className="inline-flex items-center gap-1.5 kpi-label">
              <Sparkles size={16} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
              <span>Avg Sales / day</span>
            </p>
            {renderKpiValue(avgSalesPerDay)}
          </Card>
          <Card className="dashboard-panel p-4">
            <p className="inline-flex items-center gap-1.5 kpi-label">
              <Archive size={16} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
              <span>Inventory Value</span>
            </p>
            {renderKpiValue(inventoryValue, true)}
          </Card>
          <Card className="dashboard-panel p-4">
            <p className="inline-flex items-center gap-1.5 kpi-label">
              <Boxes size={16} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
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

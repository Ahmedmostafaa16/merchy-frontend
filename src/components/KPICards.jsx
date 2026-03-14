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
          <p className="panel-note">Complete Inventory Sync and Sales Sync to load KPI cards.</p>
        </Card>
      ) : loadingKpis ? (
        <>
          <KPIStatCard label="Total SKUs" />
          <KPIStatCard label="Avg Sales / day" />
          <KPIStatCard label="Inventory Value" />
          <KPIStatCard label="Units in Stock" />
        </>
      ) : (
        <>
          <Card className="dashboard-panel p-4">
            <p className="kpi-label">Total SKUs</p>
            {renderKpiValue(totalSkus)}
          </Card>
          <Card className="dashboard-panel p-4">
            <p className="kpi-label">Avg Sales / day</p>
            {renderKpiValue(avgSalesPerDay)}
          </Card>
          <Card className="dashboard-panel p-4">
            <p className="kpi-label">Inventory Value</p>
            {renderKpiValue(inventoryValue, true)}
          </Card>
          <Card className="dashboard-panel p-4">
            <p className="kpi-label">Units in Stock</p>
            {renderKpiValue(unitsInStock, true)}
          </Card>
        </>
      )}
    </div>
  );
};

export default KPICards;

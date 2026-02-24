import Card from "./Card";
import Skeleton from "./Skeleton";

const KPIStatCard = ({ label }) => {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-[#94a2ca]">{label}</p>
      <Skeleton className="mt-3 h-7 w-24" />
    </Card>
  );
};

export default KPIStatCard;

import Card from "./Card";
import Skeleton from "./Skeleton";

const KPIStatCard = ({ label, icon: Icon }) => {
  return (
    <Card className="p-4">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#94a2ca]">
        {Icon ? <Icon size={16} strokeWidth={1.5} color="rgba(255,255,255,0.7)" /> : null}
        <span>{label}</span>
      </p>
      <Skeleton className="mt-3 h-7 w-24" />
    </Card>
  );
};

export default KPIStatCard;

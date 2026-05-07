import Card from "./Card";
import Skeleton from "./Skeleton";

const KPIStatCard = ({ label, icon: Icon, iconClassName = "bg-sky-100 text-sky-600" }) => {
  return (
    <Card className="p-4">
      <p className="inline-flex items-center gap-2 text-xs font-medium text-[#6B7280]">
        {Icon ? (
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${iconClassName}`}>
            <Icon size={15} strokeWidth={1.8} />
          </span>
        ) : null}
        <span>{label}</span>
      </p>
      <Skeleton className="mt-3 h-7 w-24" />
    </Card>
  );
};

export default KPIStatCard;

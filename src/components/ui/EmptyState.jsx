import { Inbox } from "lucide-react";

const EmptyState = ({
  title = "No data yet",
  subtitle = "",
  className = "",
}) => {
  return (
    <div className={`rounded-[18px] border border-[#E5E7EB] bg-[#F8FAFC] px-6 py-12 text-center ${className}`}>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
        <Inbox size={22} strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-base font-semibold text-[#111827]">{title}</h3>
      {subtitle ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7280]">{subtitle}</p> : null}
    </div>
  );
};

export default EmptyState;

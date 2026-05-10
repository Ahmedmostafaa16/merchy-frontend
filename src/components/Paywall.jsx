import UpgradeButton from "./UpgradeButton";
import { CheckCircle2 } from "lucide-react";

const FEATURES = [
  "Inventory forecasting & planning",
  "Weekly Email Report",
  "Purchase Orders",
  "KPIs Dashboard",
];

const Paywall = ({ shop }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-10 text-[#111827]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[28px] border border-[#E5E7EB] bg-white p-8 shadow-[0_28px_80px_rgba(15,23,42,0.12)] md:p-10">
          <div className="inline-flex rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">
            Merchy Basic Plan
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">Your trial has ended</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6B7280] md:text-base">
            Upgrade to keep forecasting inventory, tracking demand, and managing replenishment
            workflows inside your Shopify store. Shopify will show the available plan details and
            handle subscription approval securely.
          </p>

          <div className="mt-8 rounded-[22px] border border-[#E5E7EB] bg-[#F8FAFC] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#64748B]">
              Included features
            </p>
            <ul className="mt-5 grid gap-3 text-sm text-[#374151] md:grid-cols-2">
              {FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <CheckCircle2 size={17} className="text-[#10B981]" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <UpgradeButton
              shop={shop}
              className="sm:w-auto sm:min-w-[180px] sm:px-8"
            />
            <p className="text-sm text-[#6B7280]">
              You will be redirected to Shopify to review managed pricing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;

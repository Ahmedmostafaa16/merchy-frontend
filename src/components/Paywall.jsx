import UpgradeButton from "./UpgradeButton";

const FEATURES = [
  "Inventory forecasting & planning",
  "Weekly Email Report",
  "Purchase Orders",
  "KPIs Dashboard",
];

const Paywall = ({ shop }) => {
  return (
    <div className="min-h-screen bg-[#0a1228] px-6 py-10 text-[#dbe4ff]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[28px] border border-white/10 bg-[#101935] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:p-10">
          <div className="inline-flex rounded-full border border-[#6A329F]/40 bg-[#6A329F]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d7b8ff]">
            Merchy Basic Plan
          </div>

          <h1 className="mt-6 text-3xl font-bold text-white md:text-4xl">Your trial has ended</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aab6d3] md:text-base">
            Upgrade to keep forecasting inventory, tracking demand, and managing replenishment
            workflows inside your Shopify store. Shopify will show the available plan details and
            handle subscription approval securely.
          </p>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8fa2d9]">
              Included features
            </p>
            <ul className="mt-5 grid gap-3 text-sm text-[#e5ecff] md:grid-cols-2">
              {FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="rounded-2xl border border-white/8 bg-[#0f1730] px-4 py-3"
                >
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
            <p className="text-sm text-[#8fa2d9]">
              You will be redirected to Shopify to review managed pricing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;

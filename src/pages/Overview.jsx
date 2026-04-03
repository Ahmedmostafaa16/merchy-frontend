import Dashboard from "./Dashboard";

const Overview = ({ settingsEmail = "" }) => {
  return <Dashboard page="overview" settingsEmail={settingsEmail} />;
};

export default Overview;

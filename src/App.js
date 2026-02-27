import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import InstallSuccess from "./pages/InstallSuccess";
import AppLoader from "./pages/AppLoader";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLoader />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/install/success" element={<InstallSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

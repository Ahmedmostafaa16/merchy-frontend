import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLoader from "./pages/AppLoader";
import Dashboard from "./pages/Dashboard";
import InstallSuccess from "./pages/InstallSuccess";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLoader />} />
        <Route path="/install/success" element={<InstallSuccess />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

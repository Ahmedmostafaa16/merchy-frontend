import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import InstallSuccess from "./pages/InstallSuccess";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/install/success" element={<InstallSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

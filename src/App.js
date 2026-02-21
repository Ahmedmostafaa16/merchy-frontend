import { BrowserRouter, Routes, Route } from "react-router-dom";
import InstallSuccess from "./pages/InstallSuccess";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div style={{padding:40}}>Merchy running ✅</div>} />
        <Route path="/install/success" element={<InstallSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

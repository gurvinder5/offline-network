import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Create from "./pages/Create";
import Messages from "./pages/Messages";
import QR from "./pages/QR";
import Connect from "./pages/Connect";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/qr" element={<QR />} />
          <Route path="/connect" element={<Connect />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
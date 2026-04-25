import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Messages from "./pages/Messages";
import QR from "./pages/QR";
import Connect from "./pages/Connect";
import Alerts from "./pages/Alerts";
import {
  loadState,
  saveState,
  resetState,
  createMessage,
  deleteMessage,
  exportBundle,
  importBundle,
  recordOutgoingSync,
  summarize,
} from "./lib/mesh";

function App() {
  const [state, setState] = useState(() => loadState());
  const stats = useMemo(() => summarize(state), [state]);

  const encodedDrop = useMemo(() => {
    try {
      return exportBundle(state, "drop").encoded;
    } catch {
      return "";
    }
  }, [state]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  function handleCreate(form) {
    setState((s) => createMessage(s, form));
  }

  function handleDelete(messageId) {
    setState((s) => deleteMessage(s, messageId));
  }

  function handleExport(mode) {
    const bundle = exportBundle(state, mode);
    setState((s) => recordOutgoingSync(s, bundle.payload));
    return bundle.encoded;
  }

  function handleImport(encoded) {
    let result;
    setState((s) => {
      const imported = importBundle(s, encoded);
      result = imported.result;
      return imported.nextState;
    });
    return result;
  }

  function handleReset() {
    setState(resetState());
  }

  return (
    <Router>
      <Navbar nodeToken={state.nodeToken} stats={stats} onReset={handleReset} />
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<Home state={state} stats={stats} />} />
          <Route path="/create" element={<Create onCreate={handleCreate} />} />
          <Route path="/messages" element={<Messages messages={state.messages} onDelete={handleDelete} />} />
          <Route path="/qr" element={<QR encodedDrop={encodedDrop} onImport={handleImport} />} />
          <Route path="/connect" element={<Connect state={state} onExport={handleExport} onImport={handleImport} />} />
          <Route path="/alerts" element={<Alerts messages={state.messages} onCreate={handleCreate} />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

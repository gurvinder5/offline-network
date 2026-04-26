import { useEffect, useMemo, useRef, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
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
import * as rtc from "./lib/webrtc";

function App() {
  const [state, setState] = useState(() => loadState());
  const stats = useMemo(() => summarize(state), [state]);

  // Lifted WebRTC state — persists across tab navigation
  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);
  const [rtcPhase, setRtcPhase] = useState("idle");
  const [offerString, setOfferString] = useState("");
  const [answerString, setAnswerString] = useState("");

  // Cleanup on app unmount only
  useEffect(() => {
    return () => {
      rtc.closeConnection(pcRef.current);
    };
  }, []);

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

  const rtcProps = {
    pcRef,
    dataChannelRef,
    rtcPhase,
    setRtcPhase,
    offerString,
    setOfferString,
    answerString,
    setAnswerString,
  };

  return (
    <Router>
      <Navbar nodeToken={state.nodeToken} stats={stats} onReset={handleReset} />
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<Home state={state} stats={stats} />} />
          <Route path="/create" element={<Create onCreate={handleCreate} />} />
          <Route path="/messages" element={<Messages messages={state.messages} onDelete={handleDelete} />} />
          <Route path="/qr" element={<QR encodedDrop={encodedDrop} onImport={handleImport} />} />
          <Route path="/connect" element={<Connect state={state} onExport={handleExport} onImport={handleImport} rtcProps={rtcProps} />} />
          <Route path="/alerts" element={<Alerts messages={state.messages} onCreate={handleCreate} />} />
        </Routes>
      </main>
      <BottomNav />
    </Router>
  );
}

export default App;

import { useEffect, useMemo, useRef, useState } from "react";
import * as rtc from "../lib/webrtc";
import * as ble from "../lib/ble";

function Connect({ state, onExport, onImport }) {
  // Layout state
  const [outgoing, setOutgoing] = useState("");
  const [incoming, setIncoming] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // "", "success", "error"
  const channelRef = useRef(null);

  // WebRTC state
  const [rtcPhase, setRtcPhase] = useState("idle"); // idle, offering, answering, connected
  const [offerString, setOfferString] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [answerString, setAnswerString] = useState("");
  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);

  // BLE state
  const [blePhase, setBlePhase] = useState("idle"); // idle, scanning, connected
  const [bleDevices, setBleDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);

  // BroadcastChannel for same-browser tab relay
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const ch = new BroadcastChannel("signal-cache-mesh");
    ch.onmessage = (e) => {
      if (typeof e.data === "string") {
        setIncoming(e.data);
        showStatus("Received bundle from another tab.", "success");
      }
    };
    channelRef.current = ch;
    return () => ch.close();
  }, []);

  // Cleanup WebRTC on unmount
  useEffect(() => {
    return () => {
      rtc.closeConnection(pcRef.current);
    };
  }, []);

  const messageCount = useMemo(() => state.messages.length, [state.messages.length]);

  function showStatus(msg, type = "") {
    setStatus(msg);
    setStatusType(type);
  }

  // ── Bundle tab ──
  function handleGenerate(mode) {
    const encoded = onExport(mode);
    setOutgoing(encoded);
    showStatus(`Prepared ${mode} bundle (${encoded.length} chars, up to 15 messages).`, "success");
  }

  async function copyOutgoing() {
    if (!outgoing) return;
    await navigator.clipboard.writeText(outgoing);
    showStatus("Bundle copied to clipboard.", "success");
  }

  function broadcastOutgoing() {
    if (!outgoing || !channelRef.current) return;
    channelRef.current.postMessage(outgoing);
    showStatus("Bundle broadcast to other open tabs.", "success");
  }

  function importIncoming(e) {
    e.preventDefault();
    try {
      const result = onImport(incoming);
      showStatus(`Imported ${result.importedCount} new, ${result.updatedCount} updated.`, "success");
      setIncoming("");
    } catch (err) {
      showStatus(err.message, "error");
    }
  }

  // ── WebRTC tab ──
  async function startOffer() {
    try {
      setRtcPhase("offering");
      showStatus("Generating connection offer...", "");
      const { pc, channel, offerString: offer } = await rtc.createOffer();
      pcRef.current = pc;
      dataChannelRef.current = channel;
      setOfferString(offer);
      showStatus("Offer ready. Share it with the other device, then paste their answer below.", "success");

      rtc.waitForChannelOpen(channel).then(() => {
        setRtcPhase("connected");
        showStatus("P2P connection established!", "success");
        setupDataChannel(channel);
      });
    } catch (err) {
      showStatus(`Offer failed: ${err.message}`, "error");
      setRtcPhase("idle");
    }
  }

  async function applyAnswer() {
    if (!answerInput || !pcRef.current) return;
    try {
      await rtc.completeConnection(pcRef.current, answerInput);
      showStatus("Answer applied — waiting for channel to open...", "");
    } catch (err) {
      showStatus(`Answer failed: ${err.message}`, "error");
    }
  }

  async function startAnswer() {
    try {
      setRtcPhase("answering");
      showStatus("Processing offer and generating answer...", "");
      const { pc, channelPromise, answerString: answer } = await rtc.createAnswer(answerInput);
      pcRef.current = pc;
      setAnswerString(answer);
      showStatus("Answer ready. Share it back with the initiator.", "success");

      channelPromise.then(async (channel) => {
        dataChannelRef.current = channel;
        await rtc.waitForChannelOpen(channel);
        setRtcPhase("connected");
        showStatus("P2P connection established!", "success");
        setupDataChannel(channel);
      });
    } catch (err) {
      showStatus(`Answer failed: ${err.message}`, "error");
      setRtcPhase("idle");
    }
  }

  function setupDataChannel(channel) {
    rtc.onReceiveBundle(channel, (encoded) => {
      try {
        const result = onImport(encoded);
        showStatus(`P2P sync: +${result.importedCount} new, ${result.updatedCount} updated.`, "success");
      } catch (err) {
        showStatus(`P2P import error: ${err.message}`, "error");
      }
    });
  }

  function sendViaPeer() {
    if (!dataChannelRef.current) return;
    const encoded = onExport("encounter");
    try {
      rtc.sendBundle(dataChannelRef.current, encoded);
      showStatus("Bundle sent to connected peer.", "success");
    } catch (err) {
      showStatus(`Send failed: ${err.message}`, "error");
    }
  }

  function disconnectPeer() {
    rtc.closeConnection(pcRef.current);
    pcRef.current = null;
    dataChannelRef.current = null;
    setRtcPhase("idle");
    setOfferString("");
    setAnswerInput("");
    setAnswerString("");
    showStatus("Disconnected.", "");
  }

  // ── BLE tab ──
  async function startBleScan() {
    try {
      setBlePhase("scanning");
      setBleDevices([]);
      showStatus("Initializing Bluetooth...", "");
      await ble.initializeBle();
      showStatus("Scanning for nearby Mesh nodes...", "");
      await ble.scanForNodes((device) => {
        setBleDevices((prev) => [...prev, device]);
      });
    } catch (err) {
      showStatus(`BLE Scan failed: ${err.message}`, "error");
      setBlePhase("idle");
    }
  }

  async function connectBle(device) {
    try {
      showStatus(`Connecting to ${device.name || 'Unknown Node'}...`, "");
      await ble.connectToNode(device.deviceId, () => {
        setBlePhase("idle");
        setConnectedDevice(null);
        showStatus("BLE Node disconnected.", "");
      });
      setConnectedDevice(device);
      setBlePhase("connected");
      showStatus("BLE Connected! Ready to sync.", "success");
      
      ble.receiveBundle(device.deviceId, (encoded) => {
        try {
          const result = onImport(encoded);
          showStatus(`BLE P2P sync: +${result.importedCount} new, ${result.updatedCount} updated.`, "success");
        } catch (err) {
          showStatus(`BLE P2P import error: ${err.message}`, "error");
        }
      });
    } catch (err) {
      showStatus(`BLE Connect failed: ${err.message}`, "error");
    }
  }

  async function sendViaBle() {
    if (!connectedDevice) return;
    const encoded = onExport("encounter");
    try {
      showStatus("Sending bundle via BLE...", "");
      await ble.sendBundle(connectedDevice.deviceId, encoded + '||END||');
      showStatus("Bundle sent to BLE peer.", "success");
    } catch (err) {
      showStatus(`Send failed: ${err.message}`, "error");
    }
  }

  async function disconnectBle() {
    if (!connectedDevice) return;
    await ble.disconnectNode(connectedDevice.deviceId);
  }

  return (
    <section className="stack-page">
      <div className="panel-heading">
        <p className="eyebrow">Peer encounter</p>
        <h1>Relay data between devices</h1>
        <p className="lead">
          This node holds {messageCount} active messages. Exchange via QR bundles, WebRTC peer connection, or clipboard.
        </p>
      </div>

      <div className="alert-banner" style={{ marginBottom: 20 }}>
        <span className="pulse-dot green" />
        <strong>Hardware Sync Active:</strong> Choose a method below to pair with another device.
      </div>

      {status && (
        <p className={`notice ${statusType}`}>{status}</p>
      )}

      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        
        {/* ── Manual Bundle Section ── */}
        <section className="sync-section">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: "1.5rem" }}>📦</span>
            <h2>Manual Bundle / Air-gap</h2>
          </div>
          <article className="info-panel" style={{ height: "100%" }}>
            <div className="action-row" style={{ marginBottom: 16 }}>
              <button className="primary-button" type="button" onClick={() => handleGenerate("encounter")}>
                Generate encounter bundle
              </button>
              <button className="secondary-button" type="button" onClick={() => handleGenerate("drop")}>
                Generate drop bundle
              </button>
            </div>
            {outgoing && (
              <>
                <textarea className="payload-box" value={outgoing} readOnly style={{ marginTop: 12 }} />
                <div className="action-row" style={{ marginTop: 8, marginBottom: 20 }}>
                  <button className="secondary-button" type="button" onClick={copyOutgoing}>
                    Copy
                  </button>
                  <button className="secondary-button" type="button" onClick={broadcastOutgoing}>
                    Broadcast to tabs
                  </button>
                </div>
              </>
            )}

            <h3 style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 16 }}>Import bundle</h3>
            <form onSubmit={importIncoming}>
              <textarea
                className="payload-box"
                value={incoming}
                onChange={(e) => setIncoming(e.target.value)}
                placeholder="Paste a bundle received from another device."
              />
              <button className="primary-button" type="submit" style={{ marginTop: 10 }}>
                Merge into vault
              </button>
            </form>
          </article>
        </section>

        {/* ── WebRTC / Local WiFi P2P ── */}
        <section className="sync-section">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: "1.5rem" }}>📡</span>
            <h2>Local Wi-Fi Sync (P2P)</h2>
          </div>
          <article className="info-panel" style={{ height: "100%" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
              Connect directly to another device on the same local Wi-Fi network or hotspot using WebRTC.
            </p>
            <div className={`connection-status ${rtcPhase === "connected" ? "connected" : rtcPhase === "idle" ? "disconnected" : "connecting"}`}>
              <span className={`pulse-dot ${rtcPhase === "connected" ? "green" : rtcPhase === "idle" ? "" : "amber"}`}
                style={rtcPhase === "idle" ? { background: "var(--text-dim)" } : {}} />
              {rtcPhase === "idle" && "No active connection"}
              {rtcPhase === "offering" && "Waiting for answer..."}
              {rtcPhase === "answering" && "Generating answer..."}
              {rtcPhase === "connected" && "Connected — P2P channel open"}
            </div>

            {rtcPhase === "idle" && (
              <div style={{ marginTop: 16 }}>
                <h3>Start a connection</h3>
                <div className="action-row" style={{ marginBottom: 14 }}>
                  <button className="primary-button" type="button" onClick={startOffer}>
                    I'm initiating (create offer)
                  </button>
                </div>
                <h3>Or join a connection</h3>
                <textarea
                  className="payload-box"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Paste the offer from the initiating device here."
                  style={{ minHeight: 80 }}
                />
                <button className="primary-button" type="button" onClick={startAnswer} style={{ marginTop: 8 }}>
                  Accept offer & generate answer
                </button>
              </div>
            )}

            {rtcPhase === "offering" && (
              <div style={{ marginTop: 16 }}>
                <h3>Your offer (share with other device)</h3>
                <textarea className="payload-box" value={offerString} readOnly style={{ minHeight: 80 }} />
                <button className="secondary-button" type="button" onClick={() => navigator.clipboard.writeText(offerString)} style={{ marginTop: 8 }}>
                  Copy offer
                </button>
                <h3 style={{ marginTop: 16 }}>Paste their answer</h3>
                <textarea
                  className="payload-box"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Paste the answer from the other device."
                  style={{ minHeight: 80 }}
                />
                <button className="primary-button" type="button" onClick={applyAnswer} style={{ marginTop: 8 }}>
                  Apply answer
                </button>
              </div>
            )}

            {rtcPhase === "answering" && answerString && (
              <div style={{ marginTop: 16 }}>
                <h3>Your answer (share back with initiator)</h3>
                <textarea className="payload-box" value={answerString} readOnly style={{ minHeight: 80 }} />
                <button className="secondary-button" type="button" onClick={() => navigator.clipboard.writeText(answerString)} style={{ marginTop: 8 }}>
                  Copy answer
                </button>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 8 }}>
                  Waiting for the initiator to apply your answer and open the channel...
                </p>
              </div>
            )}

            {rtcPhase === "connected" && (
              <div style={{ marginTop: 16 }}>
                <div className="action-row">
                  <button className="primary-button" type="button" onClick={sendViaPeer}>
                    Send my messages to peer
                  </button>
                  <button className="danger-button" type="button" onClick={disconnectPeer}>
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </article>
        </section>

        {/* ── Bluetooth Mesh ── */}
        <section className="sync-section">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: "1.5rem" }}>📶</span>
            <h2>Bluetooth Mesh</h2>
          </div>
          <article className="info-panel" style={{ height: "100%" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
              Discover and sync automatically with nearby devices using Bluetooth Low Energy.
            </p>
            <div className={`connection-status ${blePhase === "connected" ? "connected" : blePhase === "idle" ? "disconnected" : "connecting"}`}>
              <span className={`pulse-dot ${blePhase === "connected" ? "green" : blePhase === "idle" ? "" : "amber"}`}
                style={blePhase === "idle" ? { background: "var(--text-dim)" } : {}} />
              {blePhase === "idle" && "Bluetooth Offline"}
              {blePhase === "scanning" && "Scanning for nodes..."}
              {blePhase === "connected" && `Connected to ${connectedDevice?.name || 'Node'}`}
            </div>

            {blePhase === "idle" && (
              <div style={{ marginTop: 16 }}>
                <button className="primary-button" type="button" onClick={startBleScan}>
                  Scan for Nearby Nodes
                </button>
                <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>
                  Requires location and Bluetooth permissions. Ensure your device is capable of BLE Central roles.
                </p>
              </div>
            )}

            {blePhase === "scanning" && (
              <div style={{ marginTop: 16 }}>
                <h3>Discovered Nodes</h3>
                {bleDevices.length === 0 && <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Searching...</p>}
                <div className="device-list" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bleDevices.map(d => (
                    <div key={d.deviceId} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-subtle)', borderRadius: 8 }}>
                      <span>{d.name || 'Unknown Node'} ({d.deviceId})</span>
                      <button className="secondary-button" onClick={() => connectBle(d)}>Connect</button>
                    </div>
                  ))}
                </div>
                <button className="secondary-button" type="button" onClick={() => { ble.stopScan(); setBlePhase("idle"); }} style={{ marginTop: 16 }}>
                  Stop Scan
                </button>
              </div>
            )}

            {blePhase === "connected" && (
              <div style={{ marginTop: 16 }}>
                <div className="action-row">
                  <button className="primary-button" type="button" onClick={sendViaBle}>
                    Send my messages to peer
                  </button>
                  <button className="danger-button" type="button" onClick={disconnectBle}>
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </article>
        </section>

      </div>
    </section>
  );
}

export default Connect;

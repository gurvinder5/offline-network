import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import * as rtc from "../lib/webrtc";
import * as ble from "../lib/ble";

function Connect({ state, onExport, onImport, rtcProps }) {
  // Layout state
  const [outgoing, setOutgoing] = useState("");
  const [incoming, setIncoming] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // "", "success", "error"
  const channelRef = useRef(null);

  // WebRTC state — lifted to App.jsx so it survives tab navigation
  const { pcRef, dataChannelRef, rtcPhase, setRtcPhase, offerString, setOfferString, answerString, setAnswerString } = rtcProps;
  const [answerInput, setAnswerInput] = useState("");

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

  const messageCount = useMemo(() => state.messages.length, [state.messages.length]);

  function showStatus(msg, type = "") {
    setStatus(msg);
    setStatusType(type);
  }

  // ── Inline QR scanner ──
  const [scanning, setScanning] = useState(false); // which slot is scanning: false | "offer" | "answer"
  const qrScannerRef = useRef(null);
  const QR_DIV_ID = "rtc-qr-reader";

  const startQrScan = useCallback(async (slot) => {
    setScanning(slot);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(QR_DIV_ID);
        qrScannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            scanner.stop().catch(() => {});
            qrScannerRef.current = null;
            setScanning(false);
            if (slot === "offer") {
              setAnswerInput(decoded);
              showStatus("Offer scanned! Click Accept offer to continue.", "success");
            } else if (slot === "answer") {
              // auto-apply scanned answer
              rtc.completeConnection(pcRef.current, decoded)
                .then(() => showStatus("Answer scanned & applied — waiting for channel...", "success"))
                .catch((e) => showStatus(`Answer failed: ${e.message}`, "error"));
            }
          },
          () => {}
        );
      } catch (e) {
        showStatus(`Camera error: ${e.message}`, "error");
        setScanning(false);
      }
    }, 100);
  }, [pcRef]);

  const stopQrScan = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().catch(() => {});
      qrScannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => { if (qrScannerRef.current) qrScannerRef.current.stop().catch(() => {}); };
  }, []);

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
    // Check Web Bluetooth support first
    if (!ble.isBleAvailable()) {
      showStatus(
        "Bluetooth not supported in this browser. Use Chrome or Edge, and ensure the page is on localhost or HTTPS.",
        "error"
      );
      return;
    }
    try {
      setBlePhase("scanning");
      setBleDevices([]);
      showStatus("Opening Bluetooth device picker...", "");
      await ble.scanForNodes((device) => {
        ble.storeDevice(device);
        setBleDevices((prev) => [...prev, device]);
        setBlePhase("scanning");
        showStatus(`Found: ${device.name || "Unknown"}. Click Connect to pair.`, "success");
      });
    } catch (err) {
      // User cancelled the picker or no device selected — not a real error
      if (err.name === "NotFoundError" || err.message.includes("cancelled")) {
        showStatus("No device selected.", "");
      } else {
        showStatus(`BLE error: ${err.message}`, "error");
      }
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
      await ble.sendBundle(connectedDevice.deviceId, encoded);
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
                <h3>I am starting the connection</h3>
                <div className="action-row" style={{ marginBottom: 20 }}>
                  <button className="primary-button" type="button" onClick={startOffer}>
                    Generate offer QR
                  </button>
                </div>

                <h3>I am joining a connection</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 8 }}>
                  Scan the offer QR shown on the initiating device.
                </p>
                {scanning === "offer" ? (
                  <>
                    <div id={QR_DIV_ID} style={{ width: "100%", maxWidth: 280, borderRadius: 8, overflow: "hidden" }} />
                    <button className="secondary-button" type="button" onClick={stopQrScan} style={{ marginTop: 8 }}>Stop scanner</button>
                  </>
                ) : (
                  <>
                    <button className="primary-button" type="button" onClick={() => startQrScan("offer")} style={{ marginBottom: 8 }}>
                      📷 Scan offer QR
                    </button>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Or paste manually:</p>
                    <textarea
                      className="payload-box"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Paste the offer from the initiating device."
                      style={{ minHeight: 60 }}
                    />
                  </>
                )}
                <button className="primary-button" type="button" onClick={startAnswer} style={{ marginTop: 8 }}>
                  Accept offer & generate answer
                </button>
              </div>
            )}

            {rtcPhase === "offering" && (
              <div style={{ marginTop: 16 }}>
                <h3>Step 1 — Show this QR to Device B</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 12 }}>
                  Device B opens Hardware Sync → scans this QR code with the camera.
                </p>
                <div style={{ background: "#fff", padding: 16, borderRadius: 12, display: "inline-block", marginBottom: 12 }}>
                  <QRCodeSVG value={offerString} size={200} level="M" />
                </div>

                <h3 style={{ marginTop: 20 }}>Step 2 — Scan Device B's answer QR</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 8 }}>
                  After Device B generates their answer, scan their QR code below.
                </p>
                {scanning === "answer" ? (
                  <>
                    <div id={QR_DIV_ID} style={{ width: "100%", maxWidth: 280, borderRadius: 8, overflow: "hidden" }} />
                    <button className="secondary-button" type="button" onClick={stopQrScan} style={{ marginTop: 8 }}>Stop scanner</button>
                  </>
                ) : (
                  <>
                    <button className="primary-button" type="button" onClick={() => startQrScan("answer")} style={{ marginBottom: 8 }}>
                      📷 Scan answer QR
                    </button>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Or paste manually:</p>
                    <textarea
                      className="payload-box"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Paste the answer from the other device."
                      style={{ minHeight: 60 }}
                    />
                    <button className="primary-button" type="button" onClick={applyAnswer} style={{ marginTop: 8 }}>
                      Apply answer
                    </button>
                  </>
                )}
              </div>
            )}

            {rtcPhase === "answering" && answerString && (
              <div style={{ marginTop: 16 }}>
                <h3>Step 1 — Show this QR to Device A</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 12 }}>
                  Device A (the initiator) scans this QR to complete the handshake.
                </p>
                <div style={{ background: "#fff", padding: 16, borderRadius: 12, display: "inline-block" }}>
                  <QRCodeSVG value={answerString} size={200} level="M" />
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 12 }}>
                  Waiting for Device A to scan... connection will open automatically.
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
            <div style={{
              background: "rgba(255,180,0,0.08)",
              border: "1px solid rgba(255,180,0,0.3)",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 16,
              display: "flex",
              gap: 10,
              alignItems: "flex-start"
            }}>
              <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 600, color: "var(--amber, #f5a623)", marginBottom: 4, fontSize: "0.9rem" }}>
                  Native App Required
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  Web browsers can only <strong>scan</strong> for Bluetooth devices — they cannot
                  <strong> advertise</strong> themselves. This means two web browsers can never
                  discover each other over BLE.
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 6, lineHeight: 1.5 }}>
                  Bluetooth Mesh works when at least one device runs the <strong>native Android/iOS app</strong> built
                  from this project using Capacitor.
                </p>
              </div>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 12 }}>
              <strong style={{ color: "var(--text)" }}>Use these instead for web-to-web sync:</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: "var(--bg-subtle)", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem" }}>
                <strong>📡 Local Wi-Fi P2P (above)</strong> — same network, QR-based handshake, instant sync.
              </div>
              <div style={{ background: "var(--bg-subtle)", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem" }}>
                <strong>📦 Manual Bundle / QR Drop</strong> — fully offline, scan a QR code from any screen.
              </div>
            </div>
          </article>
        </section>

      </div>
    </section>
  );
}

export default Connect;

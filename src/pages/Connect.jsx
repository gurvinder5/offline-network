import { useEffect, useMemo, useRef, useState } from "react";
import * as rtc from "../lib/webrtc";

function Connect({ state, onExport, onImport }) {
  const [tab, setTab] = useState("bundle");
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

  return (
    <section className="stack-page">
      <div className="panel-heading">
        <p className="eyebrow">Peer encounter</p>
        <h1>Relay data between devices</h1>
        <p className="lead">
          This node holds {messageCount} active messages. Exchange via QR bundles, WebRTC peer connection, or clipboard.
        </p>
      </div>

      <div className="tabs">
        <button className={`tab-button ${tab === "bundle" ? "active" : ""}`} onClick={() => setTab("bundle")}>
          Bundle Transfer
        </button>
        <button className={`tab-button ${tab === "p2p" ? "active" : ""}`} onClick={() => setTab("p2p")}>
          WebRTC P2P
        </button>
      </div>

      {status && (
        <p className={`notice ${statusType}`}>{status}</p>
      )}

      {tab === "bundle" && (
        <>
          <article className="info-panel">
            <h2>Export bundle</h2>
            <div className="action-row">
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
                <div className="action-row" style={{ marginTop: 8 }}>
                  <button className="secondary-button" type="button" onClick={copyOutgoing}>
                    Copy
                  </button>
                  <button className="secondary-button" type="button" onClick={broadcastOutgoing}>
                    Broadcast to tabs
                  </button>
                </div>
              </>
            )}
          </article>

          <article className="info-panel">
            <h2>Import bundle</h2>
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
        </>
      )}

      {tab === "p2p" && (
        <article className="info-panel">
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
      )}
    </section>
  );
}

export default Connect;

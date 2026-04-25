import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";

function QR({ encodedDrop, onImport }) {
  const [tab, setTab] = useState("generate");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const scannerRef = useRef(null);
  const scannerDivId = "qr-scanner-region";

  // Generate QR code whenever the payload changes
  useEffect(() => {
    if (!encodedDrop || tab !== "generate") return;
    QRCode.toDataURL(encodedDrop, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [encodedDrop, tab]);

  const startScanner = useCallback(async () => {
    if (scanning) return;
    setScanResult("");
    setImportStatus("");

    try {
      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        (decoded) => {
          setScanResult(decoded);
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
        },
        () => {} // ignore scan failures
      );
      setScanning(true);
    } catch (err) {
      setImportStatus(`Camera error: ${err.message || err}`);
    }
  }, [scanning]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  function handleImportScanned() {
    if (!scanResult || !onImport) return;
    try {
      const result = onImport(scanResult);
      setImportStatus(`Imported ${result.importedCount} new, ${result.updatedCount} updated messages.`);
      setScanResult("");
    } catch (err) {
      setImportStatus(err.message);
    }
  }

  return (
    <section className="stack-page">
      <div className="panel-heading">
        <p className="eyebrow">Communal data drop</p>
        <h1>QR-based information exchange</h1>
        <p className="lead">
          Generate scannable QR codes to leave in public spaces, or scan codes left by others.
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${tab === "generate" ? "active" : ""}`}
          onClick={() => { setTab("generate"); stopScanner(); }}
        >
          Generate QR
        </button>
        <button
          className={`tab-button ${tab === "scan" ? "active" : ""}`}
          onClick={() => setTab("scan")}
        >
          Scan QR
        </button>
      </div>

      {tab === "generate" && (
        <article className="drop-card">
          <div className="drop-header">
            <span>Mesh Drop</span>
            <strong>Static communal point</strong>
          </div>
          {qrDataUrl ? (
            <>
              <div className="qr-canvas-wrap">
                <img src={qrDataUrl} alt="QR code containing message bundle" style={{ maxWidth: 320 }} />
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
                Scan this QR with another device to transfer messages.
                Print it and post in shared spaces for communal drops.
              </p>
              <textarea
                className="payload-box"
                readOnly
                value={encodedDrop}
                placeholder="No bundle generated yet."
                style={{ minHeight: 80 }}
              />
            </>
          ) : (
            <div className="empty-state">
              Create some messages first, then return here to generate a QR drop.
            </div>
          )}
        </article>
      )}

      {tab === "scan" && (
        <article className="info-panel">
          <h2>Scan a QR code</h2>
          <p className="lead" style={{ marginBottom: 14 }}>
            Point your camera at a Signal Cache QR code to import its messages.
          </p>

          <div className="action-row" style={{ marginBottom: 14 }}>
            {!scanning ? (
              <button className="primary-button" type="button" onClick={startScanner}>
                Start camera
              </button>
            ) : (
              <button className="danger-button" type="button" onClick={stopScanner}>
                Stop camera
              </button>
            )}
          </div>

          <div id={scannerDivId} className="scanner-container" style={{ minHeight: scanning ? 300 : 0 }} />

          {scanResult && (
            <div style={{ marginTop: 16 }}>
              <p className="notice">QR code scanned successfully!</p>
              <div className="action-row" style={{ marginTop: 10 }}>
                <button className="primary-button" type="button" onClick={handleImportScanned}>
                  Import messages
                </button>
              </div>
            </div>
          )}

          {importStatus && (
            <p className={`notice ${importStatus.includes("error") || importStatus.includes("Could not") ? "error" : "success"}`} style={{ marginTop: 12 }}>
              {importStatus}
            </p>
          )}
        </article>
      )}
    </section>
  );
}

export default QR;

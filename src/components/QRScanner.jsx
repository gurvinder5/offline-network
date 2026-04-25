import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const scannerDivId = "qr-reader";

  const startScanner = useCallback(async () => {
    if (scanning) return;
    setScanResult("");
    setError("");

    try {
      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanResult(decodedText);
          scanner.stop().catch(console.error);
          scannerRef.current = null;
          setScanning(false);
        },
        (errorMessage) => {
          // ignore continuous scanning errors
        }
      );
      setScanning(true);
    } catch (err) {
      setError(`Camera error: ${err.message || err}`);
    }
  }, [scanning]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl w-full max-w-md">
      <h2 className="text-2xl font-bold text-white tracking-tight">Scan QR Code</h2>
      
      {!scanning ? (
        <button
          onClick={startScanner}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 cursor-pointer"
        >
          Start Camera
        </button>
      ) : (
        <button
          onClick={stopScanner}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-red-500/25 active:scale-95 cursor-pointer"
        >
          Stop Camera
        </button>
      )}

      <div 
        id={scannerDivId} 
        className="w-full max-w-[300px] rounded-xl overflow-hidden bg-black/20"
        style={{ minHeight: scanning ? '250px' : '0' }}
      />

      {error && (
        <div className="w-full p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {scanResult && (
        <div className="w-full p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex flex-col gap-2">
          <span className="text-green-300 text-xs font-semibold uppercase tracking-wider">Result:</span>
          <p className="text-white break-all font-mono text-sm">{scanResult}</p>
        </div>
      )}
    </div>
  );
}

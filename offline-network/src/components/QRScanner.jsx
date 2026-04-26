import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera } from '@capacitor/camera';

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const scannerDivId = "qr-reader";

  const requestPermissions = async () => {
    try {
      const status = await Camera.checkPermissions();
      if (status.camera !== 'granted') {
        const request = await Camera.requestPermissions({ permissions: ['camera'] });
        return request.camera === 'granted';
      }
      return true;
    } catch (err) {
      console.warn("Permission request failed, falling back to browser prompt:", err);
      return true; // Fallback to browser/webview prompt
    }
  };

  const startScanner = useCallback(async () => {
    if (scanning) return;
    setScanResult("");
    setError("");

    // Request native permissions first for Capacitor/Mobile
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setError("Camera permission denied. Please enable it in settings.");
      return;
    }

    setScanning(true); // Set scanning true BEFORE starting to ensure DIV has height

    try {
      // Small delay to ensure DOM has updated with the height
      await new Promise(r => setTimeout(r, 100));

      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          setScanResult(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // ignore continuous scanning errors
        }
      );
    } catch (err) {
      setScanning(false);
      setError(`Camera error: ${err.message || err}`);
      console.error(err);
    }
  }, [scanning]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn("Stop error", e);
      }
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

      <div className="relative w-full aspect-square max-w-[300px] overflow-hidden rounded-2xl bg-black/40 border-2 border-white/5 flex items-center justify-center">
        {!scanning && !scanResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2">
            <div className="w-12 h-12 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
              📸
            </div>
            <span className="text-xs font-medium">Camera Preview</span>
          </div>
        )}

        <div
          id={scannerDivId}
          className="w-full h-full"
        />

        {scanning && (
          <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/50 rounded-2xl animate-pulse" />
        )}
      </div>

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

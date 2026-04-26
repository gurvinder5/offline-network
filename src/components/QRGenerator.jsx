import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRGenerator() {
  const [text, setText] = useState('https://example.com');

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl w-full max-w-md">
      <h2 className="text-2xl font-bold text-white tracking-tight">Generate QR Code</h2>
      <div className="w-full">
        <label htmlFor="qr-text" className="block text-sm font-medium text-gray-300 mb-2">
          Sample Text or URL
        </label>
        <input
          id="qr-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>
      <div className="p-4 bg-white rounded-xl shadow-inner flex justify-center items-center">
        <QRCodeSVG 
          value={text || ' '} 
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="text-sm text-gray-400 text-center">
        Scan this QR code with any standard reader or our scanner.
      </p>
    </div>
  );
}

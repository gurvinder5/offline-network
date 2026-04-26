import { useState } from 'react';
import QRGenerator from '../components/QRGenerator';
import QRScanner from '../components/QRScanner';

export default function QR({ encodedDrop, onImport }) {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-6 w-full font-sans">
      <div className="w-full max-w-xl flex flex-col items-center gap-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            QR Studio
          </h1>
          <p className="text-sm text-gray-400">
            Exchange messages offline via QR codes.
          </p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full max-w-[300px]">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all cursor-pointer text-sm ${
              activeTab === 'generate'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all cursor-pointer text-sm ${
              activeTab === 'scan'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Scan
          </button>
        </div>

        <div className="w-full flex justify-center mt-2">
          {activeTab === 'generate' ? <QRGenerator /> : <QRScanner />}
        </div>
        
      </div>
    </div>
  );
}

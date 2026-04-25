import { useState } from 'react';
import QRGenerator from '../components/QRGenerator';
import QRScanner from '../components/QRScanner';

export default function QR({ encodedDrop, onImport }) {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 w-full font-sans">
      <div className="max-w-3xl w-full flex flex-col items-center gap-8">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
            QR Studio
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Easily generate and scan QR codes with a modern, simple interface.
          </p>
        </div>

        <div className="flex bg-white/10 p-1 rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Scan
          </button>
        </div>

        <div className="w-full flex justify-center mt-4 transition-all duration-500">
          {activeTab === 'generate' ? <QRGenerator /> : <QRScanner />}
        </div>
        
      </div>
    </div>
  );
}

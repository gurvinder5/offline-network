import React, { useState } from 'react';

const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];

const Create = ({ onCreate }) => {
  const [kind, setKind] = useState('news');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [area, setArea] = useState('');
  const [priority, setPriority] = useState('medium');
  const [ttlHours, setTtlHours] = useState('6');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    onCreate({ kind, title, body, area, priority, ttlHours });
    setTitle('');
    setBody('');
    setArea('');
    setKind('news');
    setPriority('medium');
    setTtlHours('6');
    setSuccessMsg('Message saved to vault!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Create Message</h1>
        <p className="text-slate-400">Publish a new alert or news update to the vault.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">

        {/* Message Kind */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">Message Type</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'alert',   icon: '⚠',  label: 'Alert'   },
              { value: 'route',   icon: '🛤',  label: 'Route'   },
              { value: 'medical', icon: '🏥',  label: 'Medical' },
              { value: 'news',    icon: '📰',  label: 'News'    },
              { value: 'drop',    icon: '📦',  label: 'Drop'    },
              { value: 'dm',      icon: '✉',   label: 'DM'      },
            ].map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
                  kind === opt.value
                    ? 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="kind"
                  value={opt.value}
                  checked={kind === opt.value}
                  onChange={(e) => setKind(e.target.value)}
                  className="sr-only"
                />
                {opt.icon} {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-slate-300">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief, descriptive title"
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            required
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <label htmlFor="body" className="block text-sm font-medium text-slate-300">
            Content <span className="text-red-400">*</span>
          </label>
          <textarea
            id="body"
            rows="4"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message here..."
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
            required
          />
        </div>

        {/* Area */}
        <div className="space-y-2">
          <label htmlFor="area" className="block text-sm font-medium text-slate-300">
            Area / Location <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <input
            id="area"
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. North Gate, Sector 4, River Crossing"
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        {/* Priority & TTL */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="priority" className="block text-sm font-medium text-slate-300">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              {PRIORITY_OPTIONS.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="ttl" className="block text-sm font-medium text-slate-300">Expires In</label>
            <select
              id="ttl"
              value={ttlHours}
              onChange={(e) => setTtlHours(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!title.trim() || !body.trim()}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
        >
          Save to Vault
        </button>

        {successMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
            ✓ {successMsg}
          </div>
        )}
      </form>
    </div>
  );
};

export default Create;

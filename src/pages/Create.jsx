import React, { useState } from 'react';

const Create = () => {
  const [type, setType] = useState('news');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    // Simulate processing without backend
    setTimeout(() => {
      console.log('Created Message:', { type, content, timestamp: 'Just now' });
      setContent('');
      setType('news');
      setIsSubmitting(false);
      setSuccessMsg('Message created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 600);
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Create Message</h1>
        <p className="text-slate-400">Publish a new alert or news update to the system.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">Message Type</label>
          <div className="flex gap-4">
            <label className={`flex-1 flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${type === 'alert' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
              <input type="radio" name="type" value="alert" checked={type === 'alert'} onChange={(e) => setType(e.target.value)} className="sr-only" />
              <span className="font-semibold">🚨 Alert</span>
            </label>
            <label className={`flex-1 flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${type === 'news' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
              <input type="radio" name="type" value="news" checked={type === 'news'} onChange={(e) => setType(e.target.value)} className="sr-only" />
              <span className="font-semibold">📰 News</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="content" className="block text-sm font-medium text-slate-300">Content</label>
          <textarea 
            id="content"
            rows="4" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message here..."
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || !content.trim()}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Message'}
        </button>

        {successMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center transition-all">
            {successMsg}
          </div>
        )}
      </form>
    </div>
  );
};

export default Create;

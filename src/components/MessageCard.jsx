import React from 'react';

const MessageCard = ({ message }) => {
  const { type, content, timestamp } = message;
  
  const isAlert = type === 'alert';
  const colorClass = isAlert 
    ? 'bg-red-900/20 border-red-500/30 text-red-200' 
    : 'bg-blue-900/20 border-blue-500/30 text-blue-200';
  const badgeClass = isAlert 
    ? 'bg-red-500/20 text-red-400 border-red-500/20' 
    : 'bg-blue-500/20 text-blue-400 border-blue-500/20';

  return (
    <div className={`border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${colorClass}`}>
      <div className="flex justify-between items-center mb-3">
        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${badgeClass}`}>
          {type}
        </span>
        <span className="text-xs opacity-60 font-mono">
          {timestamp}
        </span>
      </div>
      <p className="text-slate-200 text-sm leading-relaxed">
        {content}
      </p>
    </div>
  );
};

export default MessageCard;

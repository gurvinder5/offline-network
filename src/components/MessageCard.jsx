import React from 'react';
import { formatRelativeTime } from '../lib/mesh';

const KIND_STYLE = {
  alert:   { bg: 'bg-red-900/20 border-red-500/30',     badge: 'bg-red-500/20 text-red-400 border-red-500/20',     icon: '⚠' },
  route:   { bg: 'bg-yellow-900/20 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20', icon: '🛤' },
  medical: { bg: 'bg-pink-900/20 border-pink-500/30',    badge: 'bg-pink-500/20 text-pink-400 border-pink-500/20',   icon: '🏥' },
  news:    { bg: 'bg-blue-900/20 border-blue-500/30',    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/20',   icon: '📰' },
  drop:    { bg: 'bg-green-900/20 border-green-500/30',  badge: 'bg-green-500/20 text-green-400 border-green-500/20', icon: '📦' },
  dm:      { bg: 'bg-purple-900/20 border-purple-500/30', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/20', icon: '✉' },
};

const PRIORITY_COLOR = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-slate-400',
};

const MessageCard = ({ message, onDelete }) => {
  const { id, kind, title, body, area, priority, createdAt, expiresAt, hopCount, source } = message;
  const style = KIND_STYLE[kind] || KIND_STYLE.news;

  return (
    <div className={`border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${style.bg}`}>
      {/* Header row */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${style.badge}`}>
            {style.icon} {kind}
          </span>
          <span className={`text-xs font-semibold uppercase ${PRIORITY_COLOR[priority] || 'text-slate-400'}`}>
            {priority}
          </span>
          {hopCount > 0 && (
            <span className="text-xs text-slate-500 font-mono">{hopCount} hop{hopCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0"
            title="Delete message"
          >
            ×
          </button>
        )}
      </div>

      {/* Title */}
      <p className="text-white font-semibold text-sm mb-1">{title}</p>

      {/* Body */}
      <p className="text-slate-300 text-sm leading-relaxed">{body}</p>

      {/* Footer */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 text-xs text-slate-500 flex-wrap gap-1">
        <div className="flex gap-3">
          {area && <span>📍 {area}</span>}
          <span>📥 {source}</span>
        </div>
        <div className="flex gap-3 font-mono">
          <span>created {formatRelativeTime(createdAt)}</span>
          <span>expires {formatRelativeTime(expiresAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default MessageCard;

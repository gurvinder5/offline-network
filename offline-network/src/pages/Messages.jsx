import React from 'react';
import MessageCard from '../components/MessageCard';

const Messages = ({ messages, onDelete }) => {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Vault</h1>
        <p className="text-slate-400">
          {messages.length > 0
            ? `${messages.length} active message${messages.length !== 1 ? 's' : ''} stored on this node.`
            : 'No messages in the vault yet. Create one from the Create tab.'}
        </p>
      </div>

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">Vault is empty</p>
            <p className="text-sm mt-1">Messages you create or sync will appear here.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageCard key={msg.id} message={msg} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
};

export default Messages;

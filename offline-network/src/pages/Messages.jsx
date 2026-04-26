import React from 'react';
import MessageCard from '../components/MessageCard';

const Messages = ({ messages, onDelete }) => {
  return (
    <div className="stack-page">
      <div className="panel-heading">
        <h1>Vault</h1>
        <p className="lead">
          {messages.length > 0
            ? `${messages.length} active records stored.`
            : 'No local records found.'}
        </p>
      </div>

      <div className="message-list">
        {messages.length === 0 ? (
          <div className="empty-state card">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">Vault is empty</p>
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

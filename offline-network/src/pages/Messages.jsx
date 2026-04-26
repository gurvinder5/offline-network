import React, { useState } from 'react';
import MessageCard from '../components/MessageCard';

const DUMMY_MESSAGES = [
  { id: 1, type: 'alert', content: 'System maintenance scheduled for midnight.', timestamp: '10 mins ago' },
  { id: 2, type: 'news', content: 'New feature released: Dark mode is now available!', timestamp: '2 hours ago' },
  { id: 3, type: 'alert', content: 'Database connection lost. Retrying...', timestamp: 'Just now' },
];

const Messages = () => {
  const [messages] = useState(DUMMY_MESSAGES);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Messages</h1>
        <p className="text-slate-400">View your latest alerts and news updates below.</p>
      </div>
      
      <div className="grid gap-4">
        {messages.map((msg) => (
          <MessageCard key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
};

export default Messages;

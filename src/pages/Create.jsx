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
    <div className="stack-page">
      <div className="panel-heading">
        <h1>Create Update</h1>
        <p className="lead">Publish a new alert or record.</p>
      </div>

      <form onSubmit={handleSubmit} className="message-form form-panel">

        <label>
          Message Type
          <div className="filter-row">
            {[
              { value: 'alert',   label: 'Alert'   },
              { value: 'route',   label: 'Route'   },
              { value: 'medical', label: 'Medical' },
              { value: 'news',    label: 'News'    },
              { value: 'drop',    label: 'Drop'    },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKind(opt.value)}
                className={`filter-chip ${kind === opt.value ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </label>

        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description"
            required
          />
        </label>

        <label>
          Content
          <textarea
            rows="3"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type details..."
            required
          />
        </label>

        <div className="form-grid">
          <label>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Expires In
            <select value={ttlHours} onChange={(e) => setTtlHours(e.target.value)}>
              <option value="4">4h</option>
              <option value="6">6h</option>
              <option value="12">12h</option>
              <option value="24">24h</option>
            </select>
          </label>
        </div>

        <button type="submit" className="primary-button" style={{ marginTop: 10 }}>
          Save to Vault
        </button>

        {successMsg && (
          <div className="notice success">{successMsg}</div>
        )}
      </form>
    </div>
  );
};

export default Create;

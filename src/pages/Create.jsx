import { useState } from "react";
import { MESSAGE_KINDS, QUICK_TEMPLATES } from "../lib/mesh";

const DEFAULT_FORM = {
  kind: "alert",
  title: "",
  body: "",
  area: "",
  priority: "high",
  ttlHours: "6",
};

function Create({ onCreate }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [notice, setNotice] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  function updateField(e) {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
    setNotice("");
  }

  function applyTemplate(tpl) {
    setForm({ ...DEFAULT_FORM, ...tpl, area: "" });
    setShowTemplates(false);
    setNotice("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    onCreate(form);
    setForm(DEFAULT_FORM);
    setNotice("Message stored locally — ready for relay or QR drop.");
  }

  const bodyLen = form.body.length;

  return (
    <section className="form-panel">
      <div className="panel-heading">
        <p className="eyebrow">Local compose</p>
        <h1>Create a relay-friendly update</h1>
        <p className="lead">Keep messages short to survive low-bandwidth relay and QR drops.</p>
      </div>

      <div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          {showTemplates ? "Hide templates" : "⚡ Quick templates"}
        </button>
      </div>

      {showTemplates && (
        <div className="templates-grid">
          {QUICK_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              className="template-card"
              type="button"
              onClick={() => applyTemplate(tpl)}
            >
              <h4>{tpl.title}</h4>
              <p>{tpl.body.slice(0, 60)}…</p>
            </button>
          ))}
        </div>
      )}

      <form className="message-form" onSubmit={handleSubmit}>
        <label>
          Type
          <select name="kind" value={form.kind} onChange={updateField}>
            {MESSAGE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.icon} {k.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Title
          <input
            required
            name="title"
            maxLength={72}
            value={form.title}
            onChange={updateField}
            placeholder="Checkpoint moved off the east bridge"
          />
          <span className="char-counter">{form.title.length}/72</span>
        </label>

        <label>
          Message
          <textarea
            required
            name="body"
            rows={4}
            maxLength={240}
            value={form.body}
            onChange={updateField}
            placeholder="Keep it short — QR codes have limited capacity."
          />
          <span className="char-counter" style={bodyLen > 200 ? { color: "var(--red)" } : {}}>
            {bodyLen}/240
          </span>
        </label>

        <div className="form-grid">
          <label>
            Area
            <input
              required
              name="area"
              value={form.area}
              onChange={updateField}
              placeholder="Old Market"
            />
          </label>

          <label>
            Priority
            <select name="priority" value={form.priority} onChange={updateField}>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
          </label>

          <label>
            Expires in
            <select name="ttlHours" value={form.ttlHours} onChange={updateField}>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
            </select>
          </label>
        </div>

        <button className="primary-button" type="submit">
          Save locally
        </button>
        {notice && <p className="notice success">{notice}</p>}
      </form>
    </section>
  );
}

export default Create;

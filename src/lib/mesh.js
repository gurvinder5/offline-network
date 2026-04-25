/**
 * Signal Cache — Mesh Engine
 *
 * Core state management for offline mesh communication.
 * All data is local-only, ephemeral, and designed to minimize
 * exposure if a device is compromised.
 */

import LZString from "lz-string";
import { getNodeToken, randomId } from "./crypto";

const STORAGE_KEY = "sc-state-v2";

// ── Message kinds ──

export const MESSAGE_KINDS = [
  { value: "alert", label: "Emergency Alert", icon: "⚠" },
  { value: "route", label: "Safe Route", icon: "🛤" },
  { value: "medical", label: "Medical Aid", icon: "🏥" },
  { value: "news", label: "Local News", icon: "📰" },
  { value: "drop", label: "Community Drop", icon: "📦" },
  { value: "dm", label: "Direct Message", icon: "✉" },
];

export const PRIORITY_LEVELS = ["critical", "high", "medium", "low"];

const PRIORITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };

// ── Quick templates ──

export const QUICK_TEMPLATES = [
  { kind: "alert", title: "Checkpoint moved", body: "The checkpoint at this location has been relocated. Route is now passable.", priority: "high", ttlHours: "4" },
  { kind: "medical", title: "Medical aid available", body: "Volunteer medics treating injuries and providing basic supplies.", priority: "high", ttlHours: "6" },
  { kind: "route", title: "Safe passage confirmed", body: "This route has been verified clear within the last hour.", priority: "medium", ttlHours: "3" },
  { kind: "news", title: "Water distribution point", body: "Clean water being distributed at this location. Bring containers.", priority: "medium", ttlHours: "6" },
  { kind: "alert", title: "Area unsafe — avoid", body: "Active danger reported. Seek alternative routes immediately.", priority: "critical", ttlHours: "4" },
];

// ── State management ──

export function createInitialState() {
  return {
    nodeToken: getNodeToken(),
    messages: [],
    syncLog: [],
    settings: {
      maxMessages: 50,
      defaultTtlHours: 6,
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return hydrateState(parsed);
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateState(state) {
  const fallback = createInitialState();
  return {
    nodeToken: state.nodeToken || fallback.nodeToken,
    messages: pruneMessages(state.messages || []),
    syncLog: (state.syncLog || []).slice(0, 20),
    settings: { ...fallback.settings, ...state.settings },
  };
}

// ── Message operations ──

function isUnexpired(msg) {
  return new Date(msg.expiresAt).getTime() > Date.now();
}

function prioritySort(a, b) {
  const pw = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
  if (pw !== 0) return pw;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function pruneMessages(messages) {
  return messages.filter(isUnexpired).sort(prioritySort);
}

export function createMessage(state, form) {
  const now = new Date().toISOString();
  const msg = {
    id: randomId("msg"),
    kind: form.kind,
    title: form.title.trim(),
    body: form.body.trim(),
    area: form.area.trim(),
    priority: form.priority,
    createdAt: now,
    updatedAt: now,
    expiresAt: hoursFromNow(Number(form.ttlHours) || 6),
    originToken: randomId("o"), // random per-message, not linked to node
    lastCarrier: state.nodeToken,
    hopCount: 0,
    source: "local",
    hops: [state.nodeToken],
  };

  return {
    ...state,
    messages: pruneMessages([msg, ...state.messages]).slice(0, state.settings.maxMessages),
  };
}

export function deleteMessage(state, messageId) {
  return {
    ...state,
    messages: state.messages.filter((m) => m.id !== messageId),
  };
}

// ── Bundle export / import ──

export function exportBundle(state, mode = "encounter") {
  const active = pruneMessages(state.messages).slice(0, 15);
  const payload = {
    v: 2,
    mode,
    bid: randomId("b"),
    ts: new Date().toISOString(),
    carrier: state.nodeToken,
    msgs: active.map(compactMessage),
  };

  const json = JSON.stringify(payload);
  const compressed = LZString.compressToEncodedURIComponent(json);

  return { payload, encoded: compressed };
}

export function importBundle(state, encoded) {
  let json;
  try {
    json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) {
      // Fallback: try raw base64 (legacy v1 bundles)
      json = decodeURIComponent(escape(atob(encoded.trim())));
    }
  } catch {
    try {
      json = decodeURIComponent(escape(atob(encoded.trim())));
    } catch {
      throw new Error("Could not decode bundle. Invalid format.");
    }
  }

  const payload = JSON.parse(json);
  const messages = payload.msgs || payload.messages;
  if (!Array.isArray(messages)) {
    throw new Error("Bundle contains no valid messages.");
  }

  const existing = new Map(state.messages.map((m) => [m.id, m]));
  let importedCount = 0;
  let updatedCount = 0;

  for (const msg of messages) {
    if (!isUnexpired(msg)) continue;

    const merged = {
      ...msg,
      hopCount: (msg.hopCount || 0) + 1,
      lastCarrier: payload.carrier || msg.lastCarrier,
      source: payload.mode === "drop" ? "qr-drop" : "relay",
      updatedAt: msg.updatedAt || payload.ts,
      hops: [...(msg.hops || []), state.nodeToken],
    };

    const local = existing.get(msg.id);
    if (!local) {
      existing.set(msg.id, merged);
      importedCount++;
    } else if (new Date(merged.updatedAt) > new Date(local.updatedAt)) {
      existing.set(msg.id, merged);
      updatedCount++;
    }
  }

  const syncEntry = {
    id: randomId("sync"),
    direction: "in",
    mode: payload.mode,
    bundleId: payload.bid || payload.bundleId,
    carrier: payload.carrier,
    ts: new Date().toISOString(),
    importedCount,
    updatedCount,
  };

  return {
    nextState: {
      ...state,
      messages: pruneMessages(Array.from(existing.values())).slice(0, state.settings.maxMessages),
      syncLog: [syncEntry, ...state.syncLog].slice(0, 20),
    },
    result: syncEntry,
  };
}

export function recordOutgoingSync(state, payload) {
  const syncEntry = {
    id: randomId("sync"),
    direction: "out",
    mode: payload.mode,
    bundleId: payload.bid,
    carrier: payload.carrier,
    ts: payload.ts,
    exportedCount: payload.msgs.length,
  };

  return {
    ...state,
    syncLog: [syncEntry, ...state.syncLog].slice(0, 20),
  };
}

// ── Statistics ──

export function summarize(state) {
  const msgs = pruneMessages(state.messages);
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  return {
    total: msgs.length,
    critical: msgs.filter((m) => m.priority === "critical").length,
    high: msgs.filter((m) => m.priority === "high").length,
    relayed: msgs.filter((m) => m.hopCount > 0).length,
    local: msgs.filter((m) => m.source === "local").length,
    expiringSoon: msgs.filter((m) => new Date(m.expiresAt).getTime() - Date.now() < TWO_HOURS).length,
    byKind: MESSAGE_KINDS.reduce((acc, k) => {
      acc[k.value] = msgs.filter((m) => m.kind === k.value).length;
      return acc;
    }, {}),
  };
}

// ── Helpers ──

function compactMessage(msg) {
  return {
    id: msg.id,
    kind: msg.kind,
    title: msg.title,
    body: msg.body,
    area: msg.area,
    priority: msg.priority,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    expiresAt: msg.expiresAt,
    originToken: msg.originToken,
    lastCarrier: msg.lastCarrier,
    hopCount: msg.hopCount,
    hops: (msg.hops || []).slice(-5), // keep last 5 hops only
  };
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

export function formatRelativeTime(isoString) {
  const diff = new Date(isoString).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const sign = diff < 0 ? "-" : "";

  if (absDiff < 60000) return "now";
  if (absDiff < 3600000) return `${sign}${Math.round(absDiff / 60000)}m`;
  if (absDiff < 86400000) return `${sign}${Math.round(absDiff / 3600000)}h`;
  return `${sign}${Math.round(absDiff / 86400000)}d`;
}

export function formatTimestamp(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function resetState() {
  const initial = createInitialState();
  saveState(initial);
  return initial;
}

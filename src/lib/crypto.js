/**
 * Crypto utilities for Signal Cache.
 * Handles anonymous identity, content hashing, and bundle fragmentation.
 */

const SESSION_TOKEN_KEY = "sc-node-token";

/**
 * Generate or retrieve a per-session anonymous node token.
 * 6 random alphanumeric characters — no persistent identity.
 */
export function getNodeToken() {
  let token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    token = generateToken(6);
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  return token;
}

/** Force-regenerate the node token (e.g. on manual reset). */
export function rotateNodeToken() {
  const token = generateToken(6);
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  return token;
}

function generateToken(length) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

/**
 * SHA-256 content hash of a message's core fields.
 * Used for deduplication — two messages with the same content
 * produce the same hash regardless of metadata.
 */
export async function hashMessage(message) {
  const payload = `${message.kind}|${message.title}|${message.body}|${message.area}`;
  const encoded = new TextEncoder().encode(payload);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  const array = Array.from(new Uint8Array(buffer));
  return array.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

/**
 * Generate a random message ID with optional prefix.
 */
export function randomId(prefix = "m") {
  return `${prefix}-${generateToken(8)}`;
}

/**
 * Fragment a payload string into QR-safe chunks.
 * QR codes can hold ~2,300 alphanumeric chars reliably.
 */
export function fragmentBundle(encoded, maxChunkSize = 1800) {
  if (encoded.length <= maxChunkSize) {
    return [{ index: 0, total: 1, data: encoded }];
  }

  const chunks = [];
  let offset = 0;
  while (offset < encoded.length) {
    chunks.push({
      index: chunks.length,
      total: 0, // filled below
      data: encoded.slice(offset, offset + maxChunkSize),
    });
    offset += maxChunkSize;
  }

  chunks.forEach((chunk) => {
    chunk.total = chunks.length;
  });

  return chunks;
}

/**
 * Reassemble chunks into a single payload string.
 */
export function reassembleBundle(chunks) {
  const sorted = [...chunks].sort((a, b) => a.index - b.index);

  if (sorted.length !== sorted[0]?.total) {
    throw new Error(`Missing chunks: have ${sorted.length}, need ${sorted[0]?.total}`);
  }

  return sorted.map((c) => c.data).join("");
}

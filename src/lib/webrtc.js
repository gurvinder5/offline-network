/**
 * WebRTC peer-to-peer module for Signal Cache.
 * Uses manual signaling (QR / clipboard) — no server required.
 *
 * Flow:
 *   1. Initiator calls createOffer()  → gets compressed SDP offer string
 *   2. Responder calls createAnswer(offer) → gets compressed SDP answer string
 *   3. Initiator calls completeConnection(answer) → DataChannel opens
 *   4. Both sides use sendBundle / onReceiveBundle for data exchange
 */

import LZString from "lz-string";

const ICE_CONFIG = {
  iceServers: [], // no STUN/TURN needed on LAN
};

const CHANNEL_LABEL = "signal-cache-mesh";

/**
 * Create a peer connection and generate an SDP offer.
 * Returns { pc, channel, offerString }
 */
export async function createOffer() {
  const pc = new RTCPeerConnection(ICE_CONFIG);
  const channel = pc.createDataChannel(CHANNEL_LABEL);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // Wait for ICE gathering to complete
  await waitForIceGathering(pc);

  const offerString = compressSDP(pc.localDescription);

  return { pc, channel, offerString };
}

/**
 * Accept an SDP offer and generate an SDP answer.
 * Returns { pc, channel (promise), answerString }
 */
export async function createAnswer(offerString) {
  const pc = new RTCPeerConnection(ICE_CONFIG);

  // Channel will be received, not created
  const channelPromise = new Promise((resolve) => {
    pc.ondatachannel = (event) => resolve(event.channel);
  });

  const offer = decompressSDP(offerString);
  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await waitForIceGathering(pc);

  const answerString = compressSDP(pc.localDescription);

  return { pc, channelPromise, answerString };
}

/**
 * Complete the connection on the initiator side by applying the answer.
 */
export async function completeConnection(pc, answerString) {
  const answer = decompressSDP(answerString);
  await pc.setRemoteDescription(answer);
}

/**
 * Send a bundle string over an open DataChannel.
 */
export function sendBundle(channel, encodedBundle) {
  if (channel.readyState !== "open") {
    throw new Error("DataChannel is not open");
  }

  // Send in chunks if needed (DataChannel has ~16KB limit per message)
  const MAX_CHUNK = 15000;
  if (encodedBundle.length <= MAX_CHUNK) {
    channel.send(JSON.stringify({ type: "bundle", data: encodedBundle }));
  } else {
    const totalChunks = Math.ceil(encodedBundle.length / MAX_CHUNK);
    for (let i = 0; i < totalChunks; i++) {
      channel.send(
        JSON.stringify({
          type: "chunk",
          index: i,
          total: totalChunks,
          data: encodedBundle.slice(i * MAX_CHUNK, (i + 1) * MAX_CHUNK),
        })
      );
    }
  }
}

/**
 * Listen for incoming bundles on a DataChannel.
 * Calls callback(encodedBundle) when a complete bundle is received.
 */
export function onReceiveBundle(channel, callback) {
  const chunks = new Map();

  channel.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "bundle") {
        callback(msg.data);
        return;
      }

      if (msg.type === "chunk") {
        chunks.set(msg.index, msg.data);
        if (chunks.size === msg.total) {
          const full = Array.from({ length: msg.total }, (_, i) => chunks.get(i)).join("");
          chunks.clear();
          callback(full);
        }
      }
    } catch (err) {
      console.warn("[webrtc] Failed to parse message:", err);
    }
  };
}

/**
 * Get a promise that resolves when the channel opens.
 */
export function waitForChannelOpen(channel) {
  if (channel.readyState === "open") {
    return Promise.resolve(channel);
  }

  return new Promise((resolve, reject) => {
    channel.onopen = () => resolve(channel);
    channel.onerror = (e) => reject(e);
    // Timeout after 30s
    setTimeout(() => reject(new Error("Channel open timeout")), 30000);
  });
}

/**
 * Cleanly close a peer connection.
 */
export function closeConnection(pc) {
  if (!pc) return;
  try {
    pc.close();
  } catch {
    // ignore
  }
}

// ── Internal helpers ──

function waitForIceGathering(pc) {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") {
      resolve();
      return;
    }

    const check = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };

    pc.addEventListener("icegatheringstatechange", check);

    // Fallback timeout — some browsers stall on LAN
    setTimeout(resolve, 3000);
  });
}

function compressSDP(description) {
  const json = JSON.stringify({
    type: description.type,
    sdp: description.sdp,
  });
  return LZString.compressToEncodedURIComponent(json);
}

function decompressSDP(compressed) {
  const json = LZString.decompressFromEncodedURIComponent(compressed);
  if (!json) throw new Error("Invalid SDP data");
  return JSON.parse(json);
}

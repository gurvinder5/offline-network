import { BleClient, numbersToDataView, dataViewToText } from '@capacitor-community/bluetooth-le';

// Custom UUIDs for Signal Cache Mesh
const MESH_SERVICE_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';
const MESH_CHAR_RX_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';
const MESH_CHAR_TX_UUID = '0000ff03-0000-1000-8000-00805f9b34fb';

const CHUNK_SIZE = 512; // BLE MTU safe size for modern devices

export async function initializeBle() {
  await BleClient.initialize({ androidNeverForLocation: true });
}

export async function scanForNodes(onDiscover) {
  const devices = new Map();
  await BleClient.requestLEScan(
    {
      // In a real peripheral, we'd filter by MESH_SERVICE_UUID.
      // Filtering is sometimes strict on Android if the peripheral isn't advertising exactly right.
    },
    (result) => {
      if (!devices.has(result.device.deviceId)) {
        devices.set(result.device.deviceId, result.device);
        onDiscover(result.device);
      }
    }
  );

  // Stop scanning after 10 seconds
  setTimeout(async () => {
    try {
      await BleClient.stopLEScan();
    } catch (e) {
      console.warn("Scan stop failed:", e);
    }
  }, 10000);
}

export async function stopScan() {
  await BleClient.stopLEScan();
}

export async function connectToNode(deviceId, onDisconnect) {
  await BleClient.connect(deviceId, (id) => {
    if (onDisconnect) onDisconnect(id);
  });
}

export async function disconnectNode(deviceId) {
  await BleClient.disconnect(deviceId);
}

export async function sendBundle(deviceId, encodedBundle) {
  // Convert bundle string to array of bytes
  const textEncoder = new TextEncoder();
  const bytes = textEncoder.encode(encodedBundle);
  
  // Send in chunks
  const totalChunks = Math.ceil(bytes.length / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const chunk = bytes.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    
    // We send a JSON header followed by data: { i, t, d } -> index, total, data
    // For simplicity in this demo, we'll just write the raw chunk if we assume 
    // a proper protocol framing on the peripheral side.
    // In a real implementation, we'd use MESH_CHAR_TX_UUID.
    try {
      await BleClient.write(deviceId, MESH_SERVICE_UUID, MESH_CHAR_TX_UUID, numbersToDataView(Array.from(chunk)));
    } catch (err) {
      console.warn("BLE Write failed (ensure device is a valid mesh peripheral):", err);
      throw new Error("Failed to write to BLE node. Node may not support mesh service.");
    }
  }
}

export async function receiveBundle(deviceId, onBundleReceived) {
  let chunks = [];
  
  try {
    await BleClient.startNotifications(deviceId, MESH_SERVICE_UUID, MESH_CHAR_RX_UUID, (value) => {
      const text = dataViewToText(value);
      chunks.push(text);
      
      // Basic framing: if text ends with a specific delimiter, we reassemble.
      // Assuming '||END||' is our delimiter for this demo.
      if (text.endsWith('||END||')) {
        const fullText = chunks.join('').replace('||END||', '');
        chunks = [];
        onBundleReceived(fullText);
      }
    });
  } catch (err) {
    console.warn("BLE Notify failed:", err);
    throw new Error("Failed to subscribe to BLE node.");
  }
}

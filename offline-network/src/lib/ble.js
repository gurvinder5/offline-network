/**
 * BLE module for Signal Cache — Web Bluetooth API implementation.
 *
 * Uses the standard Web Bluetooth API (navigator.bluetooth) which works in
 * Chrome/Edge on desktop and Android. Does NOT require Capacitor or native plugins.
 *
 * Limitation: Web Bluetooth cannot act as a GATT peripheral (server), only as a
 * central (client). True device-to-device mesh requires one device to use a native
 * app or a BLE peripheral adapter. For web-only use, this implements the central
 * (scanner/connector) role using requestDevice().
 */

const MESH_SERVICE_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';
const MESH_CHAR_RX_UUID = '0000ff02-0000-1000-8000-00805f9b34fb'; // notify (receive)
const MESH_CHAR_TX_UUID = '0000ff03-0000-1000-8000-00805f9b34fb'; // write (send)

// Connected device state
const connections = new Map(); // deviceId -> { device, server, service }

/**
 * Check if Web Bluetooth is available in this browser.
 */
export function isBleAvailable() {
  return typeof navigator !== 'undefined' &&
    navigator.bluetooth != null &&
    typeof navigator.bluetooth.requestDevice === 'function';
}

/**
 * Initialize BLE — checks browser support.
 */
export async function initializeBle() {
  if (!isBleAvailable()) {
    throw new Error(
      'Web Bluetooth is not available. Use Chrome or Edge on Android/desktop, ' +
      'and ensure the page is served over HTTPS or localhost.'
    );
  }
}

/**
 * Scan for nearby mesh nodes using requestDevice (browser-compatible).
 * Shows the browser's native device picker UI.
 * Calls onDiscover(device) for the selected device.
 */
export async function scanForNodes(onDiscover) {
  if (!isBleAvailable()) throw new Error('Web Bluetooth not supported.');

  // requestDevice shows the browser's device picker — user selects a device
  const device = await navigator.bluetooth.requestDevice({
    // Accept any device (for discovery); in production, filter by MESH_SERVICE_UUID
    acceptAllDevices: true,
    optionalServices: [MESH_SERVICE_UUID],
  });

  if (device) {
    onDiscover({
      deviceId: device.id,
      name: device.name || 'Unknown Node',
      _device: device, // keep reference for connecting
    });
  }
}

export async function stopScan() {
  // requestDevice is a one-shot call — no persistent scan to stop
}

/**
 * Connect to a selected BLE device and discover the mesh service.
 */
export async function connectToNode(deviceId, onDisconnect) {
  // Find the device object from scanForNodes result stored in Connect.jsx
  // We need the actual BluetoothDevice object
  const stored = connections.get(deviceId);
  const device = stored?._device;

  if (!device) {
    throw new Error('Device not found. Please scan again.');
  }

  device.addEventListener('gattserverdisconnected', () => {
    connections.delete(deviceId);
    if (onDisconnect) onDisconnect(deviceId);
  });

  const server = await device.gatt.connect();

  let service;
  try {
    service = await server.getPrimaryService(MESH_SERVICE_UUID);
  } catch {
    // Device doesn't expose our custom service — store partial connection anyway
    service = null;
  }

  connections.set(deviceId, { _device: device, server, service });
}

export async function disconnectNode(deviceId) {
  const conn = connections.get(deviceId);
  if (conn?.server?.connected) {
    conn.server.disconnect();
  }
  connections.delete(deviceId);
}

/**
 * Send a bundle string to a connected BLE peripheral.
 */
export async function sendBundle(deviceId, encodedBundle) {
  const conn = connections.get(deviceId);
  if (!conn?.service) {
    throw new Error('Not connected to a mesh service. The peer device must run the native app.');
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(encodedBundle + '||END||');
  const CHUNK = 512;

  const char = await conn.service.getCharacteristic(MESH_CHAR_TX_UUID);

  for (let i = 0; i < bytes.length; i += CHUNK) {
    const chunk = bytes.slice(i, i + CHUNK);
    await char.writeValueWithoutResponse(chunk);
  }
}

/**
 * Subscribe to incoming bundles from a connected BLE peripheral.
 */
export async function receiveBundle(deviceId, onBundleReceived) {
  const conn = connections.get(deviceId);
  if (!conn?.service) {
    throw new Error('Not connected to a mesh service.');
  }

  const char = await conn.service.getCharacteristic(MESH_CHAR_RX_UUID);
  await char.startNotifications();

  let buffer = '';
  char.addEventListener('characteristicvaluechanged', (event) => {
    const text = new TextDecoder().decode(event.target.value);
    buffer += text;
    if (buffer.includes('||END||')) {
      const bundle = buffer.split('||END||')[0];
      buffer = '';
      onBundleReceived(bundle);
    }
  });
}

/**
 * Store a raw device reference so connectToNode can use it.
 * Called by Connect.jsx when scanForNodes returns a device.
 */
export function storeDevice(deviceInfo) {
  connections.set(deviceInfo.deviceId, { _device: deviceInfo._device });
}

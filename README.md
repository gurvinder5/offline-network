# Signal Cache

`Signal Cache` is an offline-first web demo for blackout conditions. It lets a team simulate three local nodes, create time-bound alerts, relay message bundles between devices, and prepare communal drop payloads for QR-style public handoff.

## What it does

- Stores messages locally in browser storage with expiry and priority metadata
- Supports multi-hop propagation through compact bundle export and import
- Uses `BroadcastChannel` for same-machine tab-to-tab demo relays without a network
- Generates a printable communal drop card backed by the current drop payload
- Registers a service worker so the app shell remains available offline after the first load

## Local demo flow

1. Run `npm install` if dependencies are missing.
2. Start the app with `npm run dev`.
3. Open multiple tabs or devices and switch between `Lantern`, `Ember`, and `Harbor`.
4. Create a message on one node.
5. Export a bundle from `Connect` and import it on another node.
6. Open `QR Drop` to show the static communal payload.

## Demo notes

- The current QR card is a visual drop marker plus encoded payload text; it is ready to swap to a standards-compliant QR encoder in a later step.
- The app is intentionally backend-free and works entirely with browser APIs plus local state.

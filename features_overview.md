# Signal Cache - Feature Overview

Signal Cache is an offline-first, decentralized mesh network messaging application designed for resilient communication in off-the-grid or infrastructure-blackout scenarios. Here is a breakdown of its core features:

## 1. Decentralized Mesh Networking
The core of the application is a local-only mesh engine that operates without a central server or internet connection. Devices act as nodes that store, carry, and relay information to other devices they encounter.

## 2. Multi-Modal Peer Synchronization
To exchange data without the internet, the app supports three distinct synchronization methods:

* **Local Wi-Fi Sync (WebRTC):** Establishes a direct, high-bandwidth P2P connection between devices on the same local network or Wi-Fi hotspot. It uses manual "Offer" and "Answer" string exchange for signaling, bypassing the need for a signaling server.
* **Bluetooth Mesh (BLE):** Uses Bluetooth Low Energy to scan for nearby devices running the app, connect, and automatically synchronize data bundles without requiring Wi-Fi.
* **Air-Gapped & Manual Sync:** Users can generate compressed "Encounter" or "Drop" bundles. These data strings can be manually copied, pasted, or sent across different mediums.
* **QR Code Optical Sync:** Integrated QR generator and scanner allow users to transmit data payloads visually from screen to camera, ideal for highly secure, air-gapped data transfers.

## 3. Advanced Message Management
Messages are treated as ephemeral intelligence reports rather than standard chat texts.

* **Message Categories:** Information is strictly categorized (e.g., Emergency Alerts, Safe Routes, Medical Aid, Local News).
* **Priority Levels:** Messages have priority weights (Critical, High, Medium, Low) which dictate sorting order and which messages get synced first when bandwidth is limited.
* **Time-to-Live (TTL):** Every message has an expiration time. The app automatically prunes expired messages to ensure the network isn't clogged with outdated intelligence.
* **Hop Tracking:** The system records the "hops" (previous devices) a message has traveled through to map information flow and prevent infinite routing loops.

## 4. Encounter vs. Drop Bundles
The system distinguishes between how data is shared to map network topology:
* **Encounter Bundles:** Used when two users physically meet or connect directly (live relay).
* **Drop Bundles:** Designed for asynchronous sharing, like leaving a printed QR code on a wall for others to scan later (dead drop).

## 5. Security and Data Optimization
* **Data Compression:** All outbound data bundles are heavily compressed using `lz-string` to ensure they fit within the tight size limits of QR codes and Bluetooth packets.
* **Local-Only Storage:** Data is persisted exclusively on the device's local storage. There are no cloud backups or centralized databases.
* **Cryptographic Identity:** The application utilizes the Web Crypto API to generate unique node tokens and manage cryptographic identifiers.

## 6. PWA & Mobile Ready
* **Premium Tactical UI:** Features a dark-themed, highly responsive "resistance tool" user interface designed for legibility in poor conditions.
* **Cross-Platform:** Built as a web application that can be compiled to native iOS/Android apps using Capacitor.

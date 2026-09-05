# Pulse API Client ⚡
> **Lightweight, Privacy-First Desktop API Testing Client** — The modern developer alternative to Postman.

![Pulse Banner](https://img.shields.io/badge/Pulse-API%20Client-blue?style=for-the-badge&logo=electron)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

Pulse is an offline-first, blazing-fast desktop client designed for developers who want complete control over their API workflows without cloud lock-in, forced logins, or telemetry bloat.

---

## ✨ Key Features

### 🚀 Core API Testing
- **REST, GraphQL & WebSocket Clients**: Test standard HTTP verbs, full GraphQL queries with schemas & variables, and real-time bidirectional WebSocket connections.
- **Dynamic Variable Interpolation**: Environment variables (`{{base_url}}`, `{{token}}`) resolve on-the-fly across URLs, headers, params, and JSON bodies.
- **Multi-Tab Workspace**: High-performance tabs with inline rename, duplicate, middle-click close, and horizontal scrolling.
- **Flexible Resizing**: Draggable split layouts for side-by-side or stacked request/response inspections.

### 🧠 Pulse AI Performance Doctor
- **Automatic Latency Breakdown**: Identifies slow server execution, unindexed database delays, and cold starts.
- **Compression & Payload Audit**: Detects uncompressed JSON payloads (>5 KB) and calculates potential 65%-80% bandwidth savings.
- **Caching Policies & Security**: Scans for missing `Cache-Control`, `HSTS`, and sensitive data leaks (e.g. passwords, AWS keys, JWT secrets).
- **Actionable Backend Solutions**: Generates ready-to-use fix snippets for Express.js, FastAPI, Go, and SQL/MongoDB.

### 🛡️ Top-Tier Privacy & Security
- **Zero-Cloud Requirement**: 100% of your requests, collections, environments, and history stay on your local disk.
- **Hardware-Level Secret Encryption**: Encrypts sensitive auth tokens using OS-native secure storage (Windows DPAPI via Electron `safeStorage`).
- **Sandboxed Context Isolation**: Secure preload IPC bridging with zero direct Node.js renderer exposure.

### 💎 Unique Developer Power Tools
- **Zero-Cloud Local Mock Server**: Spin up local HTTP mock routes directly on `http://localhost:3500` with custom status codes and JSON payloads.
- **Visual Response Diff Engine**: Side-by-side JSON comparison comparing current responses against historical executions.
- **Pulse Blast Micro Load Tester**: Concurrent virtual user benchmark engine generating p50, p90, and p99 latency percentiles.
- **1-Click OpenAPI 3.0 Exporter**: Convert any collection into a production-ready OpenAPI 3.0 specification JSON file.
- **cURL Import / Export & Polyglot Code Generator**: Convert requests to cURL, JavaScript (Fetch / Axios), Python (Requests), Go, Rust, PHP, and C#.

---

## 📥 How Anyone Can Download & Use Pulse

### Option 1: Download Pre-Built Release (Recommended)
1. Go to the [Releases Page](https://github.com/azmiruddinalif/Pulse-api/releases).
2. Download the latest `Pulse-Windows-x64.zip`.
3. Extract the folder and run **Pulse**!

### Option 2: Run from Source

```bash
# 1. Clone the repository
git clone https://github.com/azmiruddinalif/Pulse-api.git

# 2. Enter the project directory
cd Pulse-api

# 3. Install dependencies
npm install

# 4. Start the application in development mode
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl + Enter</kbd> | Send Request |
| <kbd>Ctrl + T</kbd> | New Request Tab |
| <kbd>Ctrl + W</kbd> | Close Active Tab |
| <kbd>Ctrl + B</kbd> | Toggle Sidebar |
| <kbd>Ctrl + L</kbd> | Toggle Layout (Horizontal / Vertical) |
| <kbd>Ctrl + K</kbd> | Quick Command Palette |

---

## 🛠️ Tech Stack

- **Desktop Framework**: Electron 34
- **UI & State**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Zustand
- **Build System**: Vite 6, esbuild
- **Networking**: Axios, ws (WebSocket), Node.js native http/https

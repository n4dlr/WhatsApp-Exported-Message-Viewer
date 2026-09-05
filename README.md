# ChatVault Viewer

ChatVault Viewer is a professional, local-first WhatsApp-style exported message viewer. It supports TXT/ZIP chat exports, SQLite msgstore databases, media ZIPs, a Database Inspector, virtualized message rendering, and an encrypted-backup adapter architecture for secure processing.

This repository is a full rewrite intended to be a maintainable, modular foundation.

## Features
- Import TXT chat exports and ZIP archives
- Open SQLite databases (msgstore.db) using sql.js (WASM)
- Database Inspector with read-only SQL exploration
- Virtualized message list for large conversations
- Media mapping from ZIP archives
- IndexedDB-backed session tracking
- Local-first design — no data is uploaded by default
- Backend adapter scaffold for encrypted backups (/backend)

## UI
Designed to be visually similar to WhatsApp Web without claiming to be official. The app is named ChatVault Viewer.

## Installation

Requirements: Node.js 22+ and npm (native SQLite is used for large databases)

### Linux quick start

```bash
git clone https://github.com/n4dlr/WhatsApp-Exported-Message-Viewer.git
cd WhatsApp-Exported-Message-Viewer
./setup-linux.sh
./start-linux.sh
```

Open `http://127.0.0.1:5173`. Press `Ctrl+C` to stop both the frontend and local encrypted-backup backend.

Do not start only `npm run dev` for encrypted backups; the local backend must also be running. The combined `./start-linux.sh` command starts both services.

If ports `3001` or `5173` are already occupied, `start-linux.sh` automatically selects the next available ports. You can also provide a starting port:

```bash
BACKEND_PORT=3002 ./start-linux.sh
```

The ports can be changed:

```bash
FRONTEND_PORT=5174 BACKEND_PORT=3002 ./scripts/start-linux.sh
```

### Manual setup

```bash
npm install --legacy-peer-deps
npm run dev
```

For encrypted backup imports, run the backend separately:

```bash
npm run start:backend
```

The backend listens on port 3001 by default and exposes POST `/api/import/encrypted-backup`. It decrypts supported `.crypt15` backups locally using the supplied 64-character hex key.

## Production build

npm run build

To preview the build:

npm run preview

## Security & Privacy
- Local-first: files are processed in the browser wherever possible.
- Encrypted backup processing is explicitly handled by the backend adapter only if you run it locally. The adapter validates key material but does not implement crypt15 decryption. This avoids guessing/brute force and avoids sending private data to third-party servers.
- XSS safety: message HTML is escaped before rendering; media URLs are object URLs created from local files.

## Notes on encrypted backups
Handling WhatsApp encrypted backups (crypt12/14/15) requires format-specific keys and careful cryptographic implementations. This project provides a secure adapter API for local/back-end processing but intentionally does not implement untrusted decryption. If you have a decrypted `msgstore.db`, import it directly.

## Project structure
See `src/` for components, services, parsers, stores, types, and workers.

## Contributing
This is a personal project scaffold. If you build features, ensure they are implemented locally and follow the privacy-first principles.

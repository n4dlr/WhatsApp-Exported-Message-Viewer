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

Requirements: Node.js 18+ and npm

1. Install dependencies

npm install

2. Start frontend dev server

npm run dev

3. (Optional) Start backend adapter for encrypted backups

npm run start:backend

The backend listens on port 3001 by default and exposes POST /api/import/encrypted-backup which validates inputs but does not perform crypt15 decryption (see security notes below).

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

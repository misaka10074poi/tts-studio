# TTS Studio

TTS Studio is a local-first desktop voiceover workstation for long-form text-to-speech production.
It helps creators paste long scripts, split them into manageable segments, generate audio with a TTS API, retry failed segments, and export MP3 or WAV output.

## Features

- Professional three-panel workstation layout for voice selection, text editing, segment review, and generation status.
- Built-in voice mode and voice-clone configuration mode.
- Long-text splitting with a single editable segment list.
- Concurrent generation queue with progress tracking, failed-task retry, and local output folders.
- MP3 and WAV output support.
- Electron desktop packaging for Windows.

## Tech Stack

- React 18
- TypeScript
- Vite
- MUI
- Tailwind CSS
- Zustand
- Electron

## Getting Started

Install dependencies:

```bash
npm install
```

Run the web development server:

```bash
npm run dev
```

Run the Electron app in development mode:

```bash
npm run electron:start
```

Build the frontend:

```bash
npm run build
```

Build the Windows desktop app:

```bash
npm run electron:build
```

## API Configuration

This project does not ship with an API key. Configure your own TTS API endpoint and key from the app settings dialog.

Do not commit personal API keys, generated audio, or private output folders.

## Project Status

This repository is an early open-source desktop TTS workstation. Current focus areas include:

- Improving desktop packaging reliability.
- Hardening local file output and history restore flows.
- Adding automated UI and generation workflow tests.
- Improving documentation for third-party TTS provider configuration.

## License

MIT

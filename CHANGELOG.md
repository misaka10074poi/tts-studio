# Changelog

All notable changes to TTS Studio are documented in this file.

---

## [v4.1.0] — 2026-06-01

### Fixed
- **Open output directory button** now correctly resolves paths in Electron via `openPath()`
- **Voice preview overlap**: clicking a new voice card now auto-pauses the currently playing one (global Audio singleton)
- **Generate button accessibility**: generation controls now use `position: sticky` to stay visible while scrolling

### Changed
- **Architecture cleanup**: removed unauthorized `WorkstationPage` and `workspaceStore`, restored 3-page architecture
- **Navigation**: removed `workspaceStore` dependency from `AppLayout`, `StatusBar`, `TextInputPanel`, `ProjectDrawer` — replaced with React Router navigation and `mode` prop
- **Redundant files removed**: `src/pages/WorkstationPage.tsx`, `src/store/workspaceStore.ts`, root `main.cjs`, `.env.example`, `docs/codex_for_oss_application.md`
- **API Key**: `constants.ts` now defaults to empty string (never committed to git)

### Fixed (QA Audit — 14 issues)
- HIGH: `ttsApi.ts` — `AbortSignal.any()` combines external signal with 120s timeout
- HIGH: `useAudioPlayer.ts` — named callbacks + `removeEventListener` to fix listener leak
- HIGH: `VoiceCard.tsx` — cleanup effect releases Audio element on unmount
- HIGH: `ProjectDrawer.tsx` — restores `lastOutputDir` when switching projects
- MEDIUM: `audioProcessor.ts` — singleton AudioContext, dead code removed
- MEDIUM: `outputService.ts` — return value checking on `ensureDir`
- MEDIUM: `apiConfigStore.ts` — `try/catch` on `localStorage.setItem`
- MEDIUM: `projectStore.ts` — `Array.isArray()` validation on JSON.parse
- LOW: `textSplitter.ts` — empty segment filter, `splitByRule` function
- LOW: `outputService.ts` — consistent empty string handling
- LOW: `GenerationPanel.tsx` — failed segment tracking + snackbar summary
- LOW: `TextInputPanel.tsx` — mammoth type assertion cleanup
- LOW: `main.cjs` — conditional logging

### Added
- **Matt Pocock skills setup**: `CLAUDE.md`, `CONTEXT.md`, `docs/agents/` (issue tracker, triage labels, domain docs)
- **GitHub Issues** (#1-3) created and closed for the three user-reported bugs
- **Triage labels**: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`
- **Documentation**: `docs/dev-handoff.md`, updated `README.md` with full architecture

---

## [v4.0.0] — 2026-05-31

### Added
- **Live auto-split**: removed manual split button; text input auto-splits with 500ms debounce
- **Segment preview panel**: collapsible segment list with full text (line-clamp-3 expandable), per-segment play/edit/delete/reorder
- **Output to local disk**: generated audio saved to `output/YYYY-MM-DD_HHmmss_title/` via Electron preload bridge
- **Open output directory** button replaces browser download
- **StatusBar**: bottom bar showing current voice, char count, segment count, output path
- **Output directory config**: setting in API config dialog
- **Project history full text**: expandable segments in ProjectDrawer

### Changed
- **UX redesign**: PRD-driven (PM → Architect → Engineer → QA), progressive disclosure over crammed panels
- **Layout reference**: Balabolka-style spacious design

### Fixed
- `.docx` upload mammoth API parameter (`arrayBuffer` vs `buffer`)
- Smart text splitting: greedy merge of adjacent short paragraphs
- Text max length: 10,000 → 100,000 characters

---

## [v3.0.0] — 2026-05-31

### Added
- **Electron desktop packaging** (`npm run electron:build`)
- **Voice sample preview** (▶ button on each voice card)
- **Project history** (`projectStore`, `ProjectDrawer`) with localStorage persistence

### Fixed
- **White screen**: `BrowserRouter` → `HashRouter` (file:// protocol incompatible)
- **main.cjs path**: `../dist/index.html` instead of `dist/index.html`
- **tsconfig**: added `composite: true`

---

## [v2.0.0] — 2026-05-31

### Added
- **Auto-merge and download**: completed segments merged to single WAV
- **Segment management**: edit / delete / reorder segments
- **File upload**: .txt / .md / .docx support via FileReader + mammoth
- **Task project management**: auto-save projects on generation start

### Changed
- Split threshold: 500 → 1000 chars (reduced fragmentation)
- Abort generation support

---

## [v1.0.0] — 2026-05-31

### Added
- Initial migration from `tts_studio_迁移包`
- 9 built-in voices with MiMo TTS API integration
- 3 API modes: standard TTS, voice clone, voice design
- Text splitting with configurable threshold
- Concurrent generation (2 workers) with retry
- MP3 / WAV output format support

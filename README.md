# TTS Studio — 配音工作室

桌面端长文本语音配音工作站。粘贴脚本 → 选音色 → 自动拆段 → 并发生成 → 本地输出。

https://github.com/misaka10074poi/tts-studio

## Features

- **9 种内置音色**：默认/冰糖/茉莉/苏打/白桦/Mia/Chloe/Milo/Dean，中英文覆盖
- **声音克隆**：上传音频样本或文字描述定制音色
- **智能拆分**：500ms 防抖自动拆分，三段式算法（段落→合并→标点拆分）
- **并发生成**：2 路并发 + AbortController 中止 + 失败重试
- **本地输出**：`output/YYYY-MM-DD_任务名/`，segments + 合并 WAV + metadata
- **Electron 桌面**：独立 exe，`contextIsolation` 安全模型

## Quick Start

```bash
npm install
npm run dev           # Vite 开发服务器 (localhost:5173)
npm run build         # 生产构建
npm run electron:build  # 打包 Windows exe
```

## Architecture

```
View (React) → Store (Zustand) → Service → API / Filesystem
                  ↕
              Electron preload bridge (openPath / writeFile / ensureDir)
```

See `CONTEXT.md` for domain glossary and design decisions.
See `docs/dev-handoff.md` for comprehensive development log.

## API Configuration

**No API key is shipped.** Configure your endpoint and key from the Settings dialog (gear icon in toolbar).

**Never commit API keys.** The app reads from localStorage (`tts_studio_api_config`).

## Project Structure

```
src/
├── pages/         HomePage, BuiltinVoicePage, CloneVoicePage
├── components/    builtin(6) + clone(4) + common(4) + layout(4)
├── store/         apiConfig, builtinVoice, cloneVoice, taskQueue, project
├── services/      ttsApi, textSplitter, audioProcessor, fileHelper, outputService
├── hooks/         useTtsGeneration, useDebouncedSplit, useAudioPlayer
├── types/         All TypeScript types & enums
└── config/        voices.ts (9 built-in voice profiles)
electron/          main.cjs + preload.cjs (contextBridge with 6 APIs)
docs/              PRD, system design, handoff log, agent configs
```

## Development

- `CLAUDE.md` — Agent entry point (Matt Pocock skills)
- `CONTEXT.md` — Domain glossary
- `docs/agents/` — Issue tracker, triage labels, domain doc rules
- `docs/adr/` — Architecture Decision Records

Issues tracked at: https://github.com/misaka10074poi/tts-studio/issues

## Environment

- Node 22.22.2 + TypeScript 5 + Vite 5
- Electron 42 (Windows)
- Python 3.13 (auxiliary scripts: merge_mp3, ffmpeg)

## License

MIT
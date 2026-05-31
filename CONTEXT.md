# CONTEXT.md — TTS Studio

## Domain Glossary

| Term | Definition |
|------|-----------|
| **TTS** | Text-to-Speech，文本转语音 |
| **Segment** | 文本拆分后的一个段落，≤1000 字符，对应一次 API 调用 |
| **TaskItem** | 一个 Segment 的生成任务，状态机：PENDING → GENERATING → COMPLETED/FAILED |
| **Project** | 一次完整的配音任务，包含 sourceText + segments + taskItems + voice + output |
| **Voice** | 音色，9 种内置（mimo_default/冰糖/茉莉/苏打/白桦/Mia/Chloe/Milo/Dean） |
| **Voice Clone** | 上传音频样本克隆音色，API 模型 mimo-v2.5-tts-voiceclone |
| **Voice Design** | 文字描述定制音色，API 模型 mimo-v2.5-tts-voicedesign |
| **Auto Split** | 500ms 防抖自动拆分，三段式：\n\n 分段 → 智能合并 → 。/， 拆分 |
| **Output Dir** | 音频输出目录，默认 ./output/YYYY-MM-DD_HHmmss_title/ |
| **MiMo API** | Xiaomi MiMo TTS 服务，端点 token-plan-cn.xiaomimimo.com |

## Architecture

```
View (React Components) → Store (Zustand) → Service (Pure functions) → API / Filesystem
```

### Layers
1. **Pages** (3): HomePage, BuiltinVoicePage, CloneVoicePage
2. **Components** (17): builtin(6) + clone(4) + common(4) + layout(4)
3. **Stores** (5): apiConfig, builtinVoice, cloneVoice, taskQueue, project
4. **Services** (5): ttsApi, textSplitter, audioProcessor, fileHelper, outputService
5. **Hooks** (3): useTtsGeneration, useDebouncedSplit, useAudioPlayer
6. **Electron** (2): main.cjs + preload.cjs (contextBridge with 6 APIs)

### Key Design Decisions
- **HashRouter** (not BrowserRouter) — Electron file:// protocol compatible
- **Context Isolation** — preload bridge, no Node.js in renderer
- **AbortController** — unified cancellation for all TTS requests
- **Smart Merge** — greedy merge of adjacent short paragraphs before splitting
- **Output to Disk** — via preload writeBase64File, not browser download

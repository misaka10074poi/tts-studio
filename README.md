# TTS Studio — 配音工作室

[English](#english) | [中文](#中文)

---

<h2 id="english">English</h2>

Desktop text-to-speech workstation. Paste scripts → pick a voice → auto-split → generate → export locally.

**https://github.com/misaka10074poi/tts-studio**

## Features

- **9 built-in voices**: Default/Bingtang/Moli/Suda/Baihua/Mia/Chloe/Milo/Dean (Chinese + English)
- **Voice clone**: upload audio samples or describe custom voices
- **Smart auto-split**: 500ms debounce, three-pass algorithm (paragraph → merge → punctuation)
- **Concurrent generation**: 2 workers + AbortController + auto-retry
- **Local output**: `output/YYYY-MM-DD_taskname/` with segments + merged WAV + metadata
- **Electron desktop**: standalone exe, `contextIsolation` security model

## Quick Start

```bash
npm install
npm run dev            # Vite dev server (localhost:5173)
npm run build          # Production build
npm run electron:build # Package Windows exe
```

## Architecture

```
View (React) → Store (Zustand) → Service → API / Filesystem
                  ↕
              Electron preload bridge
```

See `CONTEXT.md` for domain glossary. See `docs/dev-handoff.md` for full development journal.

## API Config

**No API key shipped.** Configure endpoint and key in Settings (gear icon). App reads from localStorage.

## Project Status

- v4.1.0 — architecture cleanup, 3 bug fixes, 14 QA fixes, Matt Pocock skills setup
- Active development. Issues tracked on [GitHub](https://github.com/misaka10074poi/tts-studio/issues).
- Tech: React 18 + TypeScript 5 + Vite 5 + MUI 5 + Tailwind 3 + Zustand 4 + Electron 42

## License

MIT

---

<h2 id="中文">中文</h2>

桌面端长文本语音配音工作站。粘贴脚本 → 选音色 → 自动拆段 → 并发生成 → 本地输出。

**https://github.com/misaka10074poi/tts-studio**

## 功能特性

- **9 种内置音色**：默认/冰糖/茉莉/苏打/白桦/Mia/Chloe/Milo/Dean，中英文覆盖
- **声音克隆**：上传音频样本或文字描述定制音色
- **智能自动拆分**：输入即拆，500ms 防抖，三段式算法（段落→合并→标点拆分）
- **并发生成**：2 路并发 + AbortController 中止 + 失败自动重试 3 次
- **本地输出目录**：`output/YYYY-MM-DD_任务名/`，含分段文件 + 合并 WAV + metadata.json
- **Electron 桌面应用**：独立 exe，`contextIsolation` 安全隔离

## 快速开始

```bash
npm install
npm run dev            # Vite 开发服务器 (localhost:5173)
npm run build          # 生产构建
npm run electron:build # 打包 Windows 桌面应用
```

双击 `release/配音工作室.exe` 即可运行。

## 架构

```
视图层 (React) → 状态层 (Zustand) → 服务层 → API / 文件系统
                      ↕
              Electron preload 桥接层
```

详见 `CONTEXT.md`（领域术语表）和 `docs/dev-handoff.md`（完整开发日志）。

## API 配置

**代码不含 API 密钥。** 从应用内的设置弹窗（齿轮图标）自行配置端点和 Key。数据存储在浏览器 localStorage，**绝不提交到 git**。

## 项目状态

- v4.1.0 — 架构清理、3 个 Bug 修复、14 个 QA 问题修复、Matt Pocock 技能体系搭建
- 活跃开发中。Issue 追踪：[GitHub Issues](https://github.com/misaka10074poi/tts-studio/issues)
- 技术栈：React 18 + TypeScript 5 + Vite 5 + MUI 5 + Tailwind CSS 3 + Zustand 4 + Electron 42

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。

## 许可证

MIT

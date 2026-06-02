# TTS Studio 配音工作室 — 开发总结文档

> **版本**: v4.2.0 | **日期**: 2026-06-02 | **状态**: 浏览器版可用，Electron 打包版文件输出未解决

---

## 1. 项目概述

基于小米 MiMo TTS API 的桌面配音工具。支持内置音色（9种）和声音克隆两种模式。

| 项目 | 值 |
|------|-----|
| 技术栈 | React 18 + MUI 5 + TypeScript 5 + Vite 5 + Zustand 4 |
| 桌面框架 | Electron 33.4.11 (electron-builder 26.8.1) |
| TTS API | https://token-plan-cn.xiaomimimo.com/v1/chat/completions |
| 仓库 | https://github.com/misaka10074poi/tts-studio |
| 当前版本 | v4.2.0 (基于 v4.1.0 迭代) |

---

## 2. 项目结构

```
E:\tts_studio\
├── electron/                 # Electron 主进程
│   ├── main.cjs             # 主进程入口
│   └── preload.cjs          # contextBridge 预加载脚本
├── src/
│   ├── App.tsx              # React 入口 + MUI ThemeProvider
│   ├── main.tsx             # Vite 入口
│   ├── index.css            # Tailwind + CSS 变量
│   ├── pages/
│   │   ├── HomePage.tsx          # 首页（两个入口卡片）
│   │   ├── BuiltinVoicePage.tsx  # 内置音色工作台
│   │   └── CloneVoicePage.tsx    # 声音克隆工作台
│   ├── components/
│   │   ├── builtin/
│   │   │   ├── GenerationPanel.tsx   # 生成面板（核心）
│   │   │   ├── TextInputPanel.tsx    # 文本输入
│   │   │   ├── SegmentPreviewPanel.tsx # 分段预览
│   │   │   ├── VoiceCard.tsx        # 音色卡片
│   │   │   └── VoiceCardGrid.tsx    # 音色网格
│   │   ├── clone/               # 声音克隆组件
│   │   ├── common/              # 通用组件（DownloadButton, AudioPlayer 等）
│   │   └── layout/              # 布局组件（AppLayout, StatusBar, ApiConfigDialog）
│   ├── services/
│   │   ├── ttsApi.ts            # TTS API 调用
│   │   ├── outputService.ts     # 输出文件管理（核心）
│   │   ├── audioProcessor.ts    # 音频处理
│   │   ├── useTtsGeneration.ts  # 生成流程 Hook
│   │   └── fileHelper.ts        # 文件下载（downloadBase64/下载Blob）
│   ├── store/                   # Zustand 状态管理
│   └── utils/                   # 常量、类型定义
├── package.json
├── CHANGELOG.md
├── cli-gen.cjs                  # 命令行 TTS 生成器（备用）
└── dist/                        # Vite 构建产物
```

---

## 3. 当前状态

### ✅ 正常工作的

| 功能 | 环境 | 说明 |
|------|------|------|
| TTS 生成 | 全部 | API 调用正常，音频可播放 |
| 音频播放 | 全部 | 浏览器原生 audio API |
| UI 交互 | 全部 | MUI 主题、路由、状态管理均正常 |
| 浏览器版 | `npm run dev` | http://localhost:5173 完整可用 |
| CLI 工具 | Node.js 命令行 | `node cli-gen.cjs "文本" --key=KEY` |
| 手动下载 | 浏览器版（v4.2.0 新增） | 生成完成后自动触发浏览器下载 |

### ⚠️ 未解决的

| 问题 | 严重程度 | 说明 |
|------|---------|------|
| **Electron 打包后的 exe 无法保存文件** | 致命 | `window.electronAPI` 为 undefined，preload 未能暴露 API |
| **Electron 打包后的 exe 显示"浏览器模式"** | 致命 | 诊断横幅显示 🔴 浏览器模式 |

---

## 4. 输出文件问题 — 完整调查记录

### 4.1 问题描述

用户运行 `E:\tts_studio\release\配音工作室.exe`（electron-builder 打包的便携版），TTS 生成正常、音频可播放，但**没有任何文件保存到磁盘**。修改输出目录路径无效。

### 4.2 已排除的原因

| 假设 | 验证结果 | 结论 |
|------|---------|------|
| 输出路径错误 | 多次修改 `getOutputBaseDir()`，包括使用 `PORTABLE_EXECUTABLE_DIR` | 不是路径问题 |
| 文件权限问题 | bash 下可直接写文件到 exe 目录 | 不是权限问题 |
| API Key 未配置 | 用户确认已配置，可正常生成+播放 | 不是配置问题 |
| 代码未更新到 asar | 多次验证 asar 内容包含最新的 main.cjs/preload.cjs | asar 内容正确 |
| `outputService.ts` 静默 no-op | 已修复：无 Electron 时抛出错误而非静默返回 | 不适用（根本未到这一步） |

### 4.3 核心发现：`window.electronAPI` 为 undefined

在打包后的 exe 中，诊断横幅显示 `🔴 浏览器模式`，意味着 `window.electronAPI === undefined`。

`window.electronAPI` 由 preload.cjs 通过 `contextBridge.exposeInMainWorld` 暴露。如果 preload 未加载或其中 `require('electron')` 失败，`contextBridge` 不可用，整个 API 不会暴露。

### 4.4 `require('electron')` 在 Electron 环境中的行为

这是**调查过程中发现的核心问题**：

#### 在项目目录内运行时（开发模式）
```
require('electron') → 返回字符串 "E:\tts_studio\node_modules\electron\dist\electron.exe"
```
原因：Node.js 模块解析找到 `node_modules/electron/index.js`（npm 包），该文件 `module.exports = 路径字符串`。

#### 在打包后的 app 中（asar 或 dir 模式）

行为**不一致**：

| 测试场景 | 结果 |
|---------|------|
| Electron 28.3.3 + asar | `require('electron')` → MODULE_NOT_FOUND |
| Electron 33.4.11 + asar | `require('electron')` → MODULE_NOT_FOUND |
| Electron 33.4.11 + dir 模式 | `require('electron')` → 部分成功，但 `e.app === null`（typeof null === 'object'） |
| Electron 33.4.11 + 延迟 1s + `setTimeout` | `require('electron')` → MODULE_NOT_FOUND |
| Electron 42.3.0 + asar | `require('electron')` → 返回字符串（npm wrapper 路径） |

**结论**：Electron 的打包后的应用无法可靠地通过 `require('electron')` 获取内置模块。这在 Electron 28、33、42 三个大版本上均复现。

### 4.5 `"type": "module"` 与 Electron 冲突

项目 `package.json` 包含 `"type": "module"`（Vite 要求）。这导致 main.cjs（`.cjs` 扩展名）在被 require 时可能受 ES 模块上下文影响。已通过 electron-builder 的 `extraMetadata: { "type": "commonjs" }` 覆盖，但未解决问题。

### 4.6 环境变量 `NODE_OPTIONS` 干扰

用户环境中设置了 `NODE_OPTIONS=--use-system-ca`，导致 Electron 启动时报错。终端测试需用 `NODE_OPTIONS=""` 清除。从 Windows 资源管理器双击启动不受影响。

### 4.7 尝试过的修复方案（全部未解决 Electron 打包问题）

1. ✅ Electron 42 → 33 降级
2. ✅ `"type": "module"` → `extraMetadata: "commonjs"` 
3. ✅ asar → dir 模式（`"asar": false`）
4. ✅ portable → dir 目标
5. ✅ `require('electron')` 解构 → 显式 `require('electron').app`
6. ✅ `process._linkedBinding` 绕过 require
7. ✅ `setTimeout` 延迟等待初始化
8. ✅ `NODE_OPTIONS` 清除
9. ✅ 用原始 electron 二进制替换 electron-builder 修改后的二进制
10. ✅ electron-builder 构建输出移到项目外（避免 node_modules 遮蔽）

### 4.8 浏览器下载方案（v4.2.0 新增）

当前临时方案：在非 Electron 模式下，生成完成后自动触发浏览器下载（`downloadBase64` + `<a>` click）。完全避开 Electron 依赖，在浏览器环境中可用。

---

## 5. 构建与运行

### 开发模式（浏览器）
```bash
cd E:\tts_studio
npm run dev
# 打开 http://localhost:5173
```

### 命令行工具
```bash
node cli-gen.cjs "要生成的文本" --key=你的API_KEY --output=./output
```

### Electron 打包
```bash
npm run electron:build
# 输出: E:\tts_studio\release\win-unpacked\  (解包版)
# 输出: E:\tts_studio\release\配音工作室.exe   (便携版)
```

**注意**：exe 可以启动，UI 正常，但文件输出不可用。如需完整桌面版，须先解决 `require('electron')` 问题。

---

## 6. 给接手开发者的建议

### 首要任务：修复 `require('electron')` 在打包环境中的解析

可能的方向：

1. **检查 npm registry 的 electron 包是否完整**
   - `node_modules/electron/dist/electron.exe --version` 输出 `v20.18.3`（Node.js 版本号）而非 `v33.4.11`（Electron 版本号）
   - 怀疑 npm 下发的 electron 二进制可能缺少内置模块注册

2. **尝试从 GitHub Releases 直接下载 electron**
   - https://github.com/electron/electron/releases
   - 下载 `electron-v33.4.11-win32-x64.zip`，解压替换 `node_modules/electron/dist/`

3. **检查 Electron 内置模块注册机制**
   - 在 Electron 源码中，`require('electron')` 由 `lib/common/init.ts` 中的 `addBuiltinModules` 注册
   - 确认打包后的 app 中，`default_app.asar` 存在且包含正确的内置模块注册代码

4. **使用 `@electron/remote` 替代方案**
   - 但已废弃（Electron 14+），不推荐

5. **完全绕过 Electron 打包，改用其他桌面方案**
   - Tauri（Rust 后端）：类似功能但更轻量
   - NW.js：对 `require` 支持更好
   - 纯 Web 应用 + PWA：配合 File System Access API

### 次要任务

- 清理 `electron/main.cjs` 中的诊断代码
- 恢复 `electron/preload.cjs` 为标准版本
- 恢复 `package.json` 中的 `"win": { "target": "portable" }` 和 `"asar": true`

---

## 7. 关键文件变更记录

| 文件 | 变更 |
|------|------|
| `electron/main.cjs` | 大量诊断日志，需清理 |
| `electron/preload.cjs` | 添加了 toBuffer + 诊断日志 |
| `src/services/outputService.ts` | 无 Electron 时抛错而非静默返回；修复 await 缺失 |
| `src/components/layout/AppLayout.tsx` | 添加诊断横幅 |
| `src/components/layout/StatusBar.tsx` | 添加 ELECTRON/BROWSER 指示器 |
| `src/components/builtin/GenerationPanel.tsx` | 浏览器模式自动下载 |
| `package.json` | `extraMetadata.type: commonjs`; `asar: false`; `target: dir` |
| `cli-gen.cjs` | 新增命令行生成工具 |
| `src/App.tsx` | 精简版 MUI 主题（紫罗兰主色） |

---

## 8. Git 版本

- `v4.0.0` — UX 重构
- `v4.1.0` — Bug 修复 + 架构清理
- `v4.2.0` — UI 主题改进 + MUI token 修复 + 浏览器下载

所有改动已推送到 `main` 分支。

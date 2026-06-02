# 配音工作室（TTS Studio）开发交接文档

> **交接人**：齐活林（交付总监）  
> **审查人**：待指定  
> **日期**：2026-05-31  
> **版本**：v4.0（迁移 → 功能增强 → Electron 打包 → UX 重构）  
> **项目路径**：`E:\tts_studio\`  
> **exe 产物**：`E:\tts_studio\release\win-unpacked\配音工作室.exe`

---

## 一、项目概述

「配音工作室」是一个基于 MiMo TTS API 的桌面配音工具。用户粘贴长文本 → 选音色 → 自动拆段 → 并发生成 → 本地输出完整音频。

**技术栈**：Vite 5 + React 18 + MUI 5 + Tailwind CSS 3 + Zustand 4 + TypeScript 5 + Electron 42  
**API 端点**：`https://token-plan-cn.xiaomimimo.com/v1/chat/completions`  
**运行时**：Node 22.22.2 + Python 3.13.12（辅助脚本）

---

## 二、项目来源与开发历程

### 2.1 来源
项目源自桌面 `C:\Users\46027\Desktop\tts_studio_迁移包`，包含：
- `tts_studio/`：44 个 React 源文件（代码已写、从未构建）
- `skill_xiaomimimo-tts/`：MiMo TTS 技能包
- `workspace_scripts/`：5 个 Python/Shell 辅助脚本
- `test_audio/`：11 个预生成测试音频

迁移包附有 `AI_DEV_GUIDE.md`，明确标注"代码已全部写出，未构建验证"。

### 2.2 开发阶段

| 阶段 | 工作内容 | 状态 |
|------|---------|------|
| R1 迁移落地 | 适配本机环境，修复 2 个 Bug，npm install + build | ✅ |
| R2 功能增强 | 5 项改进：阈值/自动合并/中止/分段管理/文件上传 | ✅ |
| R2.1 拆分修复 | 智能合并相邻短段，解决结构化文本碎片化 | ✅ |
| R2.2 任务管理 | 项目历史 Store + ProjectDrawer + docx 修复 | ✅ |
| R3 Electron 打包 | 打包 exe + 白屏修复（3 个根因） | ✅ |
| R4 UX 重构 | 产品经理→架构师→工程师→QA 全流程 | ✅ |

---

## 三、文件结构（当前完整状态）

```
E:\tts_studio\
├── index.html
├── package.json                    # 含 electron/electron-builder 配置
├── vite.config.ts                  # base: './'（Electron 兼容）
├── tsconfig.json                   # composite: true
├── tailwind.config.ts
├── postcss.config.js
├── electron/
│   ├── main.cjs                    # Electron 主进程（含 IPC handler）
│   └── preload.cjs                 # contextBridge（6 个 API）
├── public/
│   └── samples/                    # 11 个音色试听 MP3
├── scripts/
│   ├── merge_mp3.py                # ffmpeg MP3 合并（路径已适配）
│   ├── tts_batch.py / tts_merge.py # 批量 TTS 脚本
│   ├── batch_tts.sh
│   └── test_len.py
├── src/
│   ├── main.tsx                    # React 入口
│   ├── App.tsx                     # HashRouter + ThemeProvider + 路由
│   ├── vite-env.d.ts               # ElectronAPI 类型声明
│   ├── index.css                   # Tailwind + 自定义样式
│   ├── types/
│   │   └── index.ts                # 全部类型定义（枚举+接口，约 160 行）
│   ├── config/
│   │   └── voices.ts               # 9 种内置音色 + sampleUrl
│   ├── utils/
│   │   └── constants.ts            # 默认常量（API/并发/阈值/输出目录）
│   ├── store/
│   │   ├── apiConfigStore.ts       # API 配置（端点/Key/并发/输出目录）
│   │   ├── builtinVoiceStore.ts    # 内置音色工作台状态
│   │   ├── cloneVoiceStore.ts      # 声音克隆工作台状态
│   │   ├── taskQueueStore.ts       # 生成任务队列
│   │   └── projectStore.ts         # 项目历史（localStorage，最多 50 个）
│   ├── services/
│   │   ├── ttsApi.ts               # TTS API 封装（3 模型 + AbortSignal）
│   │   ├── textSplitter.ts         # 智能文本拆分（分段→合并→拆分）
│   │   ├── audioProcessor.ts       # WAV 编解码/合并
│   │   ├── fileHelper.ts           # 文件下载/读取/Base64
│   │   └── outputService.ts        # 输出目录管理（Electron bridge）
│   ├── hooks/
│   │   ├── useTtsGeneration.ts     # 生成 Hook（并发/中止/回调）
│   │   ├── useDebouncedSplit.ts    # 500ms 防抖自动拆分
│   │   └── useAudioPlayer.ts       # 音频播放
│   ├── pages/
│   │   ├── HomePage.tsx            # 首页（两卡片入口）
│   │   ├── BuiltinVoicePage.tsx    # 内置音色工作台
│   │   └── CloneVoicePage.tsx      # 声音克隆工作台
│   └── components/
│       ├── builtin/
│       │   ├── VoiceCardGrid.tsx   # 音色卡片网格
│       │   ├── VoiceCard.tsx       # 音色卡片（▶ 试听）
│       │   ├── TextInputPanel.tsx  # 文本输入 + 📎 上传 + 自动拆分
│       │   ├── SegmentPreviewPanel.tsx  # 分段预览（完整文本）
│       │   ├── SegmentManager.tsx  # 兼容 wrapper
│       │   └── GenerationPanel.tsx # 生成控制 + 任务队列 + 本地输出
│       ├── clone/ (4 files)
│       ├── common/ (4 files: AudioPlayer, TaskQueueList/Item, DownloadButton)
│       └── layout/
│           ├── AppLayout.tsx       # 顶栏 + 内容 + StatusBar
│           ├── ApiConfigDialog.tsx # API + 输出目录配置弹窗
│           ├── ProjectDrawer.tsx   # 任务历史抽屉
│           └── StatusBar.tsx       # 底部状态栏
└── dist/                           # 构建产物
```

---

## 四、关键技术决策

### 4.1 路由方案
- **决策**：`HashRouter`（非 `BrowserRouter`）
- **原因**：Electron `file://` 协议不支持 HTML5 History API，`BrowserRouter` 导致白屏

### 4.2 文本拆分算法
- **三段式**：`\n\n` 分段 → 智能合并相邻短段（贪婪，≤1000字） → 超长段按 `。` → `，` 拆分
- **阈值**：1000 字/段（原 500，后调整为缓解碎片化）
- **防抖**：500ms（`useRef<setTimeout>` + `useEffect` cleanup）

### 4.3 本地文件输出
- 通过 `electron/preload.cjs` 的 `contextBridge` 暴露 6 个 API：
  - `openPath(dir)` — 打开资源管理器
  - `writeFile(path, ArrayBuffer)` — 写入二进制文件
  - `writeBase64File(path, base64)` — Base64 写入
  - `ensureDir(path)` — 创建目录
  - `getAppPath()` — 获取应用根目录
  - `readTextFile(path)` — 读取文本文件（历史索引用）
- 所有调用前检查 `window.electronAPI` 可用性

### 4.4 输出目录规则
- 默认路径：`./output/`（相对于应用根目录，运行时由 `getAppPath()` 解析）
- 任务目录命名：`YYYY-MM-DD_HHmmss_{任务名前8字}/`
- 内含：`segments/segment_001.wav` ... `full_output.wav` + `metadata.json`
- 全局索引：`output/history_index.json`

### 4.5 状态管理
- 所有 Store 用 Zustand（`create`）
- `apiConfigStore` 持久化到 `localStorage`（Key：`tts_studio_api_config`）
- `projectStore` 持久化到 `localStorage`（Key：`tts_studio_projects`，最多 50 个）
- 其他 Store 不持久化（会话级别）

### 4.6 并发控制
- 默认 2 路并发（3 路实测瓶颈到 26 秒）
- `AbortController` 统一管理中止
- 重试 3 次，指数退避 1s/2s/4s

---

## 五、已知 Bug 及修复记录

| # | Bug | 根因 | 影响文件 | 修复 |
|---|-----|------|---------|------|
| 1 | `isGenerating` 永远 `false` | `useRef` 导出后被组件初渲染捕获 | `useTtsGeneration.ts:31` | `useRef` → `useState` |
| 2 | TypeScript 编译失败 | `'pending'` 字符串 vs `TaskStatus.PENDING` 枚举 | `GenerationPanel.tsx:95,141` | 改为枚举值 |
| 3 | `.docx` 上传失败 | mammoth API `{buffer}` vs `{arrayBuffer}` | `TextInputPanel.tsx:64` | 浏览器用 `arrayBuffer` |
| 4 | 结构化笔记拆 59 段 | `\n\n` 硬边界导致短条目独立成段 | `textSplitter.ts` | 新增 `mergeShortParagraphs()` |
| 5 | EXE 白屏（3 重） | ① BrowserRouter ② main.cjs 路径 ③ 闭标签未改完整 | `App.tsx`, `main.cjs` | ① HashRouter ② `../dist/` ③ `</HashRouter>` |
| 6 | 音色预览不响 | `new Audio('/samples/...')` 在 file:// 绝对路径失效 | `voices.ts:8` | `'/samples'` → `'./samples'` |
| 7 | tsc 虚假报错 | tsbuildinfo 缓存过期 | — | `rm tsconfig.tsbuildinfo` |

---

## 六、依赖包清单

### 运行时依赖（8 个）
```
react@^18.3.1          react-dom@^18.3.1
react-router-dom@^6.23.1
@mui/material@^5.15.20 @mui/icons-material@^5.15.20
@emotion/react@^11.11.4 @emotion/styled@^11.11.5
zustand@^4.5.2         uuid@^9.0.1
mammoth@^1.12.0
```

### 开发依赖（9 个）
```
vite@^5.3.1            @vitejs/plugin-react@^4.3.0
typescript@^5.4.5
tailwindcss@^3.4.4     postcss@^8.4.38       autoprefixer@^10.4.19
electron@^42.3.0       electron-builder@^26.8.1
@types/react@^18.3.3   @types/react-dom@^18.3.0   @types/uuid@^9.0.8
```

### Python 依赖（辅助脚本）
```
imageio-ffmpeg@0.6.0       # ffmpeg 二进制：.../imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe
mutagen@1.47.0             # 音频时长检测
```

---

## 七、构建与发布

### 开发
```bash
cd E:\tts_studio
npm run dev           # Vite 开发服务器 (localhost:5173)
```

### 生产构建
```bash
npm run build         # tsc -b && vite build  → dist/
```

### Electron 打包
```bash
npm run electron:build   # 构建 + electron-builder --win portable
```
- 产物：`release/win-unpacked/配音工作室.exe`（~227MB，含 Chromium + Electron 42 运行时）
- 签名：当前环境 winCodeSign 签名失败（权限不足），**exe 已生成，本地使用无需签名**
- 如需正式签名：需解决 GitHub 下载连通性或设置 `CSC_IDENTITY_AUTO_DISCOVERY=false`

### 辅助脚本
```bash
# MP3 拼接（从目录合并所有 mp3）
python E:\tts_studio\scripts\merge_mp3.py <输入目录> [输出文件名]

# 批量 TTS（从 txt 文件生成）
python E:\tts_studio\scripts\tts_batch.py input.txt output.mp3
```

---

## 八、关键配置项

| 配置 | 默认值 | 位置 | 说明 |
|------|--------|------|------|
| API 端点 | `https://token-plan-cn.xiaomimimo.com/v1/chat/completions` | `constants.ts` | 可界面修改 |
| API Key | 空字符串（需用户配置） | `constants.ts` | 可界面修改，禁止提交明文密钥 |
| 最大并发 | 2 | `constants.ts` | 可界面修改（1-5） |
| 拆分阈值 | 1000 字/段 | `constants.ts` | — |
| 文本上限 | 100,000 字 | `constants.ts` | — |
| 请求超时 | 120 秒 | `constants.ts` | — |
| 重试次数 | 3 次 | `constants.ts` | 指数退避 1s/2s/4s |
| 防抖延迟 | 500ms | `constants.ts` | 拆分防抖 |
| 输出目录 | `./output/` | `constants.ts` + `apiConfigStore` | 可界面修改 |
| 主色 | `#6366F1` (Indigo-500) | `App.tsx` theme | MUI 主题 |

---

## 九、MiMo TTS API 调用规范

### 三种模型请求格式

**标准 TTS（mimo-v2.5-tts）**：
```json
{
  "model": "mimo-v2.5-tts",
  "messages": [{"role": "assistant", "content": "要合成的文本"}],
  "audio": {"format": "mp3", "voice": "mimo_default"}
}
```

**声音克隆（mimo-v2.5-tts-voiceclone）**：
```json
{
  "model": "mimo-v2.5-tts-voiceclone",
  "messages": [{"role": "assistant", "content": "要合成的文本"}],
  "audio": {"format": "mp3", "voice": "data:audio/mp3;base64,BASE64编码的参考音频"}
}
```

**音色设计（mimo-v2.5-tts-voicedesign）**：
```json
{
  "model": "mimo-v2.5-tts-voicedesign",
  "messages": [
    {"role": "user", "content": "音色描述"},
    {"role": "assistant", "content": "要合成的文本"}
  ],
  "audio": {"format": "mp3"}
}
```

⚠️ **关键约束**：
- 文本放在 `assistant` 消息中
- voiceclone 的 voice 参数是 DataURL 格式
- voicedesign **不带** `audio.voice` 参数
- Key 绑定域名：token-plan 的 Key 只能在 token-plan-cn 用

### 9 种内置音色
mimo_default(默认) / 冰糖 / 茉莉 / 苏打 / 白桦 / Mia / Chloe / Milo / Dean

---

## 十、Electron 架构说明

### 主进程（main.cjs）
- 创建 BrowserWindow（1280×860，最小 900×600）
- `contextIsolation: true`，`nodeIntegration: false`
- 注册 IPC handler：`get-app-path`
- 加载 `dist/index.html`（生产）或 `localhost:5173`（开发）
- `show: false` + `ready-to-show` 防白屏闪烁

### Preload 桥接层（preload.cjs）
```js
contextBridge.exposeInMainWorld('electronAPI', {
  openPath,           // shell.openPath()
  writeFile,          // fs.writeFileSync (ArrayBuffer)
  writeBase64File,    // fs.writeFileSync (Base64)
  ensureDir,          // fs.mkdirSync
  getAppPath,         // ipcRenderer.invoke
  readTextFile,       // fs.readFileSync (UTF-8)
})
```

### 渲染进程调用约定
```ts
// 所有调用前检查可用性
const api = typeof window !== 'undefined' ? window.electronAPI : null;
if (api) {
  await api.writeBase64File(path, data);
}
```

---

## 十一、已知限制与待办

| # | 事项 | 影响 | 优先级 |
|---|------|------|--------|
| 1 | 音色试听在 Electron 中路径可能仍有问题（当前 `./samples/` 相对路径） | 音色预览 | P1 |
| 2 | 没有单元测试 | 回归验证 | P1 |
| 3 | 声音克隆页面未完整调通 | 克隆功能 | P1 |
| 4 | winCodeSign 签名失败 | 正式分发 | P2 |
| 5 | `vite preview` 静态模式无 HMR | 开发体验 | P2 |
| 6 | 超过 500KB 的 JS chunk 警告 | 首屏加载 | P3 |
| 7 | file-saver 未安装（未使用） | 无影响 | — |

---

## 十二、团队协作流水线（R4 UX 重构示例）

```
PM 许清楚        → 产出：PRD（prd-voice-studio-ux-redesign.md）
   ↓
架构师 高见远    → 产出：系统设计 + 5任务分解（system_design.md）
   ↓
工程师 寇豆码    → 实施：20 文件（新建4/修改16），0 编译错误
   ↓
QA 严过关        → 验证：20/20 文件审查通过，0 阻断问题
```

### 文件变更清单（R4）

**新建 4 个**：`src/services/outputService.ts`, `src/hooks/useDebouncedSplit.ts`, `src/components/builtin/SegmentPreviewPanel.tsx`, `src/components/layout/StatusBar.tsx`

**修改 16 个**：`types/index.ts`, `utils/constants.ts`, `store/builtinVoiceStore.ts`, `store/apiConfigStore.ts`, `electron/main.cjs`, `config/voices.ts`, `services/textSplitter.ts`, `hooks/useTtsGeneration.ts`, `pages/BuiltinVoicePage.tsx`, `components/builtin/TextInputPanel.tsx`, `components/builtin/GenerationPanel.tsx`, `components/builtin/SegmentManager.tsx`, `components/common/DownloadButton.tsx`, `components/layout/AppLayout.tsx`, `components/layout/ApiConfigDialog.tsx`, `components/layout/ProjectDrawer.tsx`

---

## 附录 A：快速启动检查清单

- [ ] `E:\tts_studio\` 目录存在且包含 `package.json`
- [ ] `node_modules\` 存在（否则执行 `npm install`）
- [ ] `dist\` 存在（否则执行 `npm run build`）
- [ ] `public\samples\` 包含 11 个 mp3（否则从迁移包复制）
- [ ] `E:\tts_studio\release\win-unpacked\配音工作室.exe` 存在
- [ ] Python `imageio-ffmpeg` + `mutagen` 已安装（辅助脚本用）

## 附录 B：常见问题

**Q: EXE 双击没反应？**  
A: 检查是否有旧实例运行（任务管理器结束 `配音工作室.exe`）

**Q: 生成按钮点了没反应？**  
A: 检查 API 配置（顶栏齿轮图标）→ 确认端点和 Key 正确

**Q: 音色试听不响？**  
A: 检查 `public/samples/` 是否存在 9 个 mp3 文件

**Q: 输出文件在哪？**  
A: 点「📂 打开输出目录」或在 `E:\tts_studio\output\` 下查找

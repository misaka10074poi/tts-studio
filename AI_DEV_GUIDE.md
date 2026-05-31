# 配音工作室 (tts_studio) — AI 开发说明书

> **用途**：换电脑后，把这个文件扔给 WorkBuddy AI，说"继续开发 tts_studio"，AI 就能接上。
> **创建时间**：2026-05-31 00:50
> **当前状态**：代码已全部写出，未构建验证

---

## 一、这是什么

一个纯前端 Web 配音工具。用户粘贴长文本 → 选音色 → 自动拆段 → 批量调 MiMo TTS API 生成 → 拼接下载完整音频。

**技术栈**：Vite 5 + React 18 + MUI 5 + Tailwind CSS 3 + Zustand 4 + React Router 6 + TypeScript 5

**项目路径**：`tts_studio/`（解压后就在迁移包根目录）

---

## 二、当前开发状态

| 阶段 | 状态 |
|------|------|
| PRD | ✅ 完成 |
| 架构设计 | ✅ 完成 |
| 全部代码编写 | ✅ 已写出 44 个文件 |
| npm install + build 验证 | ❌ 未执行 |
| QA 测试 | ❌ 未执行 |

**下一步**：先 `npm install && npm run build`，修掉所有编译错误，然后 `npm run dev` 启动看效果。

---

## 三、API 关键参数（实测，不要改）

```
端点：POST https://token-plan-cn.xiaomimimo.com/v1/chat/completions
认证：Authorization: Bearer <your-api-key>
```

### 三种模型的请求格式

**标准 TTS**（mimo-v2.5-tts）：
```json
{"model":"mimo-v2.5-tts","messages":[{"role":"assistant","content":"文本"}],"audio":{"format":"mp3","voice":"mimo_default"}}
```

**声音克隆**（mimo-v2.5-tts-voiceclone）：
```json
{"model":"mimo-v2.5-tts-voiceclone","messages":[{"role":"assistant","content":"文本"}],"audio":{"format":"mp3","voice":"data:audio/mp3;base64,BASE64编码的参考音频"}}
```

**文字设计音色**（mimo-v2.5-tts-voicedesign）：
```json
{"model":"mimo-v2.5-tts-voicedesign","messages":[{"role":"user","content":"音色描述"},{"role":"assistant","content":"文本"}],"audio":{"format":"mp3"}}
```
⚠️ voicedesign 不带 `audio.voice` 参数！

### 内置音色（9种）
mimo_default(默认女声) / 冰糖(甜美) / 茉莉(温柔) / 苏打(清爽) / 白桦(沉稳) / Mia / Chloe / Milo / Dean

### 性能约束
- 并发：**最多2路**（3路会瓶颈到26秒）
- 文本分块：**每块≤500字**（约30s语音）
- 单请求超时：120秒
- 重试：最多3次，指数退避 1s/2s/4s

---

## 四、文件结构与职责

```
tts_studio/
├── index.html                     # 入口
├── package.json                   # 18个依赖包
├── vite.config.ts                 # Vite + React 插件
├── tsconfig.json                  # strict mode
├── tailwind.config.ts             # Tailwind + MUI 前缀隔离
├── postcss.config.js
├── scripts/merge_mp3.py           # MP3拼接辅助脚本（用imageio-ffmpeg的ffmpeg）
├── src/
│   ├── main.tsx                   # React挂载点
│   ├── App.tsx                    # 根组件（ThemeProvider + Router + AppLayout）
│   ├── types/index.ts             # 全局TS类型（枚举+接口，30+行）
│   ├── config/voices.ts           # 9种音色元数据
│   ├── utils/constants.ts         # 默认常量（端点/Key/并发数/拆分阈值）
│   ├── store/
│   │   ├── apiConfigStore.ts      # API配置（端点/Key/并发数，localStorage持久化）
│   │   ├── builtinVoiceStore.ts   # 内置音色工作台状态
│   │   ├── cloneVoiceStore.ts     # 声音克隆工作台状态
│   │   └── taskQueueStore.ts      # 任务队列通用状态
│   ├── services/
│   │   ├── ttsApi.ts              # 三模型统一封装（fetch + Base64解码）
│   │   ├── textSplitter.ts        # 三级拆分（\n\n → 。→ ，）
│   │   ├── audioProcessor.ts      # Web Audio API解码/合并/WAV编码
│   │   └── fileHelper.ts          # FileReader读文件/Blob下载/Base64转换
│   ├── hooks/
│   │   ├── useTtsGeneration.ts    # 核心：2路信号量并发生成hook
│   │   └── useAudioPlayer.ts      # 音频播放hook
│   ├── pages/
│   │   ├── HomePage.tsx           # 首页（两个模式选择卡片）
│   │   ├── BuiltinVoicePage.tsx   # 内置音色工作台
│   │   └── CloneVoicePage.tsx     # 声音克隆工作台
│   ├── components/
│   │   ├── builtin/
│   │   │   ├── VoiceCardGrid.tsx  # 9宫格音色卡片
│   │   │   ├── VoiceCard.tsx      # 单个音色卡片（hover放大+选中高亮+试听按钮）
│   │   │   ├── TextInputPanel.tsx # 文本输入+拆分预览
│   │   │   └── GenerationPanel.tsx# 生成控制+输出面板
│   │   ├── clone/
│   │   │   ├── CloneMethodSelector.tsx  # 上传/描述 二选一
│   │   │   ├── AudioUploadPanel.tsx     # 文件上传（限mp3/wav, 5-30s, ≤10MB）
│   │   │   ├── VoiceDesignPanel.tsx     # 文字描述音色
│   │   │   └── CloneConfigPanel.tsx     # 克隆配置+试听
│   │   ├── common/
│   │   │   ├── AudioPlayer.tsx    # 通用音频播放器
│   │   │   ├── TaskQueueList.tsx  # 任务队列列表
│   │   │   ├── TaskQueueItem.tsx  # 单个任务项（状态图标+重试按钮）
│   │   │   └── DownloadButton.tsx # 下载按钮（格式选择）
│   │   └── layout/
│   │       ├── AppLayout.tsx      # 全局布局（顶栏+内容）
│   │       └── ApiConfigDialog.tsx# API配置弹窗
```

---

## 五、设计约束（不能改的）

1. **前端音频拼接走 WAV**，不内嵌 lamejs（太重）。MP3 格式提示用户用 Python 脚本辅助
2. **API Key 存 localStorage**，界面可覆盖，不清除则不丢
3. **UUID 用 `uuid` 包**，不允许 `Math.random`
4. **文本拆分**：500字/块，优先级 `\n\n` > `。` > `，`
5. **音色试听**：实时调 API（用户说不用省 token）
6. **主色**：#6366F1 (Indigo-500)，辅色 #8B5CF6 (Violet-500)
7. **Google Style 编码规范**，TypeScript strict

---

## 六、已知坑点

| 坑 | 教训 |
|----|------|
| MP3 不能 `cat` 拼接 | Xing VBR 头冲突，播放器只认第一段。必须 ffmpeg concat |
| imageio-ffmpeg 装 ffmpeg | `pip install imageio-ffmpeg`，二进制在 `site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe` |
| GitHub 下载 ffmpeg 被墙 | 别用 winget/choco，用 imageio-ffmpeg |
| voiceclone 参数是 DataURL | `audio.voice = "data:audio/mp3;base64,xxx"`，不是文件名 |
| voicedesign 不带 voice 参数 | 会报 400 错误 |
| API 端点绑定域名 | token-plan 的 Key 只能在 token-plan-cn 用，官方 api.xiaomimimo.com 报 401 |

---

## 七、开发环境初始化

```bash
# 在有 Node.js 22+ 的电脑上
cd tts_studio
npm install
npm run dev       # 开发服务器 (localhost:5173)
npm run build     # 生产构建
```

```bash
# Python 辅助
pip install imageio-ffmpeg mutagen
```

---

## 八、继续开发的顺序

1. **立即**：`npm install && npm run build`，修复所有编译错误 → 直到通过
2. **然后**：`npm run dev` 启动，手动点点页面看交互是否正常
3. **接着**：调通完整流程——选音色→粘贴文本→生成→下载
4. **最后**：声音克隆页面调通

---

## 九、迁移包其他文件

| 路径 | 说明 |
|------|------|
| `skill_xiaomimimo-tts/` | MiMo TTS 技能包（API调用参考文档） |
| `workspace_scripts/` | 辅助脚本（批量TTS、MP3拼接、文本长度测试） |
| `test_audio/` | 测试生成的音频样本（voicedesign/voiceclone/9种音色） |
| `tts_studio/docs/` | 架构设计文档 + Mermaid 时序图/类图 |

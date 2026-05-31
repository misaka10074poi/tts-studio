/**
 * TTS API 服务
 * 封装与 MiMo TTS API 的所有通信逻辑
 */

import { TtsRequest, TtsApiResponse, TtsModel } from '../types';
import { DEFAULTS } from '../utils/constants';
import { useApiConfigStore } from '../store/apiConfigStore';

/**
 * 发起 TTS 生成请求
 * 根据模型类型自动构建不同的请求体格式
 * @param request - TTS 请求参数
 * @returns TTS API 响应
 */
export async function generate(request: TtsRequest, signal?: AbortSignal): Promise<TtsApiResponse> {
  const { endpoint, apiKey } = useApiConfigStore.getState().config;

  const body = buildRequestBody(request);

  // 调用方主动中止
  if (signal?.aborted) {
    return { success: false, error: '已取消' };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: signal ?? AbortSignal.timeout(DEFAULTS.REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return parseResponse(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return { success: false, error: '请求超时，请稍后重试' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : '未知网络错误',
    };
  }
}

/**
 * 根据 TTS 模型类型构建请求体
 * - 标准 TTS：assistant 消息 + voice 参数
 * - 声音克隆：assistant 消息 + voice=DataURL
 * - 音色设计：user 消息(描述) + assistant 消息(文本) + 无 voice
 */
function buildRequestBody(request: TtsRequest): Record<string, unknown> {
  const base = {
    model: request.model,
    audio: { format: request.format },
  };

  switch (request.model) {
    case TtsModel.STANDARD:
      return {
        ...base,
        messages: [{ role: 'assistant', content: request.text }],
        audio: { ...base.audio, voice: request.voice || 'mimo_default' },
      };

    case TtsModel.VOICE_CLONE:
      return {
        ...base,
        messages: [{ role: 'assistant', content: request.text }],
        audio: {
          ...base.audio,
          voice: request.voice, // DataURL 格式: data:audio/mp3;base64,...
        },
      };

    case TtsModel.VOICE_DESIGN:
      return {
        ...base,
        messages: [
          { role: 'user', content: request.voiceDescription || '' },
          { role: 'assistant', content: request.text },
        ],
        audio: { ...base.audio },
      };

    default:
      return {
        ...base,
        messages: [{ role: 'assistant', content: request.text }],
      };
  }
}

/**
 * 解析 API 响应，提取音频 Base64 数据
 * 支持多种响应格式的兼容解析
 */
function parseResponse(data: Record<string, unknown>): TtsApiResponse {
  // 尝试从 choices 中提取
  const choices = data.choices as Array<Record<string, unknown>> | undefined;
  if (choices && choices.length > 0) {
    const message = choices[0].message as Record<string, unknown> | undefined;
    if (message) {
      const audio = message.audio as Record<string, unknown> | undefined;
      if (audio && audio.data) {
        return { success: true, audioBase64: audio.data as string };
      }
      // 有些响应可能直接在 message 中返回
      if (message.content && typeof message.content === 'string') {
        // 检查 content 是否是 base64 数据
        if (message.content.length > 100 && /^[A-Za-z0-9+/=]+$/.test(message.content)) {
          return { success: true, audioBase64: message.content };
        }
      }
    }
  }

  // 尝试直接从顶层 audio 字段提取
  const topAudio = data.audio as Record<string, unknown> | undefined;
  if (topAudio && topAudio.data) {
    return { success: true, audioBase64: topAudio.data as string };
  }

  // 尝试从 content 提取
  if (data.content && typeof data.content === 'string') {
    return { success: true, audioBase64: data.content };
  }

  // 尝试从 output 提取
  if (data.output && typeof data.output === 'string') {
    return { success: true, audioBase64: data.output };
  }

  return {
    success: false,
    error: `无法解析 API 响应: ${JSON.stringify(data).substring(0, 200)}`,
  };
}

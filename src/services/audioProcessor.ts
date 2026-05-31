/**
 * 音频处理服务
 * 提供音频解码、合并和 WAV 编码功能
 */

import { Mp3Encoder } from '@breezystack/lamejs';

/** 共享 AudioContext 单例，避免多次创建超出浏览器限制 */
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

/**
 * 将 Base64 编码的音频数据解码为 ArrayBuffer
 * @param base64 - Base64 编码的音频数据
 * @returns 解码后的 ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 使用 Web Audio API 解码音频 ArrayBuffer
 * @param audioData - 音频 ArrayBuffer
 * @returns 解码后的 AudioBuffer
 */
export async function decodeAudio(audioData: ArrayBuffer): Promise<AudioBuffer> {
  const audioContext = getAudioContext();
  return await audioContext.decodeAudioData(audioData);
}

/**
 * 异步合并多个 AudioBuffer
 * 所有输入的 AudioBuffer 将被重采样为相同的采样率和声道数
 * @param buffers - 要合并的 AudioBuffer 数组
 * @returns 合并后的 AudioBuffer
 */
export async function mergeAudioBuffersAsync(buffers: AudioBuffer[]): Promise<AudioBuffer> {
  if (buffers.length === 0) {
    throw new Error('没有可合并的音频数据');
  }

  if (buffers.length === 1) {
    return buffers[0];
  }

  const sampleRate = buffers[0].sampleRate;
  const numberOfChannels = buffers[0].numberOfChannels;

  let totalLength = 0;
  for (const buffer of buffers) {
    totalLength += buffer.length;
  }

  const offlineContext = new OfflineAudioContext(
    numberOfChannels,
    totalLength,
    sampleRate
  );

  let offset = 0;
  for (const buffer of buffers) {
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineContext.destination);
    source.start(offset / sampleRate);
    offset += buffer.length;
  }

  return await offlineContext.startRendering();
}

/**
 * 将 AudioBuffer 编码为 WAV 格式的 ArrayBuffer
 * WAV 格式：44 字节头 + PCM 数据
 * @param audioBuffer - 输入的 AudioBuffer
 * @returns WAV 格式的 ArrayBuffer
 */
export function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;

  // 提取所有声道的 PCM 数据
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(audioBuffer.getChannelData(ch));
  }

  const numSamples = audioBuffer.length;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // WAV 文件头
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // 写入 PCM 数据（交错声道）
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return buffer;
}

/**
 * 在 DataView 中写入 ASCII 字符串
 */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * 将 Base64 音频列表合并并导出为 WAV 格式
 * @param base64List - Base64 编码的音频数据列表
 * @returns WAV 格式的 ArrayBuffer
 */
export async function mergeAndEncodeWav(base64List: string[]): Promise<ArrayBuffer> {
  const audioBuffers: AudioBuffer[] = [];

  for (const b64 of base64List) {
    const arrayBuffer = base64ToArrayBuffer(b64);
    const audioBuffer = await decodeAudio(arrayBuffer);
    audioBuffers.push(audioBuffer);
  }

  const merged = await mergeAudioBuffersAsync(audioBuffers);
  return encodeWav(merged);
}

/** 将 Float32 PCM 转为 16-bit PCM */
function floatTo16BitPcm(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
}

/** 将 AudioBuffer 编码为 MP3 */
export function encodeMp3(audioBuffer: AudioBuffer, kbps = 128): ArrayBuffer {
  const channels = Math.min(audioBuffer.numberOfChannels, 2);
  const encoder = new Mp3Encoder(channels, audioBuffer.sampleRate, kbps);
  const blockSize = 1152;
  const mp3Chunks: Uint8Array[] = [];
  const left = floatTo16BitPcm(audioBuffer.getChannelData(0));
  const right =
    channels > 1 ? floatTo16BitPcm(audioBuffer.getChannelData(1)) : undefined;

  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const encoded =
      channels > 1 && right
        ? encoder.encodeBuffer(leftChunk, right.subarray(i, i + blockSize))
        : encoder.encodeBuffer(leftChunk);
    if (encoded.length > 0) {
      mp3Chunks.push(encoded);
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) {
    mp3Chunks.push(flushed);
  }

  const totalLength = mp3Chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of mp3Chunks) {
    output.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), offset);
    offset += chunk.length;
  }

  return output.buffer;
}

/** 将 Base64 音频列表合并并导出为 MP3 */
export async function mergeAndEncodeMp3(base64List: string[]): Promise<ArrayBuffer> {
  const audioBuffers: AudioBuffer[] = [];

  for (const b64 of base64List) {
    const arrayBuffer = base64ToArrayBuffer(b64);
    const audioBuffer = await decodeAudio(arrayBuffer);
    audioBuffers.push(audioBuffer);
  }

  const merged = await mergeAudioBuffersAsync(audioBuffers);
  return encodeMp3(merged);
}

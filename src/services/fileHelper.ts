/**
 * 文件辅助服务
 * 提供文件读取、下载和音频文件转换功能
 */

/**
 * 从文件对象读取内容为 ArrayBuffer
 * @param file - 文件对象
 * @returns ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 从文件对象读取内容为 Base64 字符串
 * @param file - 文件对象
 * @returns Base64 编码的字符串（不含 DataURL 前缀）
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 去除 DataURL 前缀 (data:audio/mp3;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 从文件对象读取内容为 DataURL 字符串
 * @param file - 文件对象
 * @returns 完整的 DataURL 字符串
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 触发文件下载
 * @param data - 文件数据（ArrayBuffer 或 Blob）
 * @param fileName - 下载文件名
 * @param mimeType - MIME 类型
 */
export function downloadFile(
  data: ArrayBuffer | Blob,
  fileName: string,
  mimeType?: string
): void {
  const blob =
    data instanceof Blob ? data : new Blob([data], { type: mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 从 Base64 数据触发下载
 * @param base64 - Base64 编码的文件数据
 * @param fileName - 下载文件名
 * @param mimeType - MIME 类型
 */
export function downloadBase64(
  base64: string,
  fileName: string,
  mimeType: string
): void {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  downloadFile(bytes.buffer, fileName, mimeType);
}

/**
 * 获取音频文件的 MIME 类型
 * @param format - 音频格式
 * @returns MIME 类型字符串
 */
export function getAudioMimeType(format: string): string {
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pcm16: 'audio/pcm',
  };
  return mimeMap[format] || 'application/octet-stream';
}

/**
 * 格式化文件大小显示
 * @param bytes - 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

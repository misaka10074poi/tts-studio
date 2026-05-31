/**
 * 文本拆分服务
 * 将长文本按规则拆分为不超过阈值的文本段
 * 拆分策略：先按段落分割 → 智能合并短段 → 拆分超长段
 */

import { v4 as uuidv4 } from 'uuid';
import { TextSegment, SplitRule } from '../types';
import { DEFAULTS } from '../utils/constants';

/**
 * 将输入文本拆分为文本段数组
 *
 * 拆分规则（三段式）：
 * 1. 按 \n\n（双换行）初步分段
 * 2. 智能合并：相邻短段合并到接近阈值，减少碎片
 * 3. 对合并后仍超长的段：按 。→ ，→ 强制截断
 *
 * @param text - 输入文本
 * @returns 拆分后的文本段数组
 */
export function splitText(text: string): TextSegment[] {
  if (!text.trim()) {
    return [];
  }

  const threshold = DEFAULTS.SPLIT_THRESHOLD;

  // Step 1: 按双换行初步分段
  const rawParagraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Step 2: 智能合并相邻短段
  const mergedChunks = mergeShortParagraphs(rawParagraphs, threshold);

  // Step 3: 对超长段进一步拆分
  const finalChunks: string[] = [];
  for (const chunk of mergedChunks) {
    if (chunk.length <= threshold) {
      finalChunks.push(chunk);
    } else {
      // 先按句号拆分
      const splitByPeriod = splitByDelimiter(chunk, threshold, '。');
      // 对仍然超长的按逗号再拆
      for (const sub of splitByPeriod) {
        if (sub.length <= threshold) {
          finalChunks.push(sub);
        } else {
          finalChunks.push(...splitByDelimiter(sub, threshold, '，'));
        }
      }
    }
  }

  return finalChunks.map((chunk, index) => ({
    id: uuidv4(),
    index,
    text: chunk,
    charCount: chunk.length,
  }));
}

/**
 * 智能合并相邻短段落
 * 贪婪策略：逐段累加，接近阈值时闭合当前段，开启下一段
 * 效果：结构化笔记（小标题+短条目）会被合并成大段，大幅减少段数
 *
 * @param paragraphs - 原始段落数组
 * @param threshold - 每段最大字符数
 * @returns 合并后的段落数组
 */
function mergeShortParagraphs(paragraphs: string[], threshold: number): string[] {
  const result: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    // 新段 = current + \n\n + para
    const separator = current ? '\n\n' : '';
    const combined = current + separator + para;

    if (combined.length <= threshold) {
      // 能装下，继续合并
      current = combined;
    } else {
      // 装不下了：闭合 current，para 成为新 current
      if (current) {
        result.push(current);
      }
      current = para;
    }
  }

  // 最后一段
  if (current) {
    result.push(current);
  }

  return result;
}

/**
 * 按指定分隔符拆分文本，确保每段不超过阈值
 * 贪心累加：逐句/逐子句添加，接近阈值时闭合
 *
 * @param text - 输入文本
 * @param threshold - 每段最大字符数
 * @param delimiter - 分割符（如"。""，"）
 * @returns 拆分后的字符串数组
 */
function splitByDelimiter(
  text: string,
  threshold: number,
  delimiter: string
): string[] {
  const parts = text.split(delimiter);
  const result: string[] = [];
  let current = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // 加上分隔符（最后一部分不加）
    const partWithDelim = i < parts.length - 1 ? part + delimiter : part;

    if (current.length + partWithDelim.length > threshold && current.length > 0) {
      result.push(current.trim());
      current = partWithDelim;
    } else {
      current += partWithDelim;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  // 兜底：仍有超长段则强制截断
  const refined: string[] = [];
  for (const chunk of result) {
    if (chunk.length <= threshold) {
      refined.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += threshold) {
        refined.push(chunk.substring(i, i + threshold).trim());
      }
    }
  }

  return refined;
}

/**
 * 按指定规则拆分文本
 * - paragraph: 按双换行拆分段落
 * - chars（默认）: 使用三段式智能拆分
 * @param text - 输入文本
 * @param rule - 拆分规则
 * @returns 拆分后的文本段数组
 */
export function splitByRule(text: string, rule: SplitRule): TextSegment[] {
  if (rule.type === 'paragraph') {
    const paragraphs = text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return paragraphs.map((p, i) => ({
      id: uuidv4(),
      index: i,
      text: p.trim(),
      charCount: p.trim().length,
    }));
  }
  // 默认按字符阈值拆分
  return splitText(text);
}

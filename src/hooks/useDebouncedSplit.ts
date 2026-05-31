/**
 * 防抖拆分 Hook
 * 监听 builtinVoiceStore.inputText 变化，防抖 500ms 后自动拆分文本
 */

import { useEffect, useRef } from 'react';
import { useBuiltinVoiceStore } from '../store/builtinVoiceStore';
import { splitText } from '../services/textSplitter';
import { DEFAULTS } from '../utils/constants';

/** 防抖自动拆分 Hook */
export function useDebouncedSplit(): void {
  const { inputText, setSegments } = useBuiltinVoiceStore();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!inputText.trim()) {
      setSegments([]);
      return;
    }

    timerRef.current = setTimeout(() => {
      const result = splitText(inputText);
      setSegments(result);
    }, DEFAULTS.SPLIT_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [inputText, setSegments]);
}

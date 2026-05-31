/**
 * 文本输入面板组件
 * 提供文本输入框、文件上传和自动拆分功能
 * 拆分由 useDebouncedSplit hook 自动触发
 */

import React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useBuiltinVoiceStore } from '../../store/builtinVoiceStore';
import { useCloneVoiceStore } from '../../store/cloneVoiceStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useDebouncedSplit } from '../../hooks/useDebouncedSplit';
import { AudioFormat } from '../../types';
import { DEFAULTS } from '../../utils/constants';

/** 文本输入面板组件 */
const TextInputPanel: React.FC = () => {
  const {
    inputText,
    setInputText,
    segments,
    isSplitExpanded,
    toggleSplitExpanded,
  } = useBuiltinVoiceStore();
  const {
    outputFormat: builtinOutputFormat,
    setOutputFormat: setBuiltinOutputFormat,
  } = useBuiltinVoiceStore();
  const {
    outputFormat: cloneOutputFormat,
    setOutputFormat: setCloneOutputFormat,
  } = useCloneVoiceStore();
  const { mode } = useWorkspaceStore();
  const outputFormat = mode === 'clone' ? cloneOutputFormat : builtinOutputFormat;
  const setOutputFormat =
    mode === 'clone' ? setCloneOutputFormat : setBuiltinOutputFormat;

  // 自动防抖拆分
  useDebouncedSplit();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = React.useState('');

  /** 处理文件上传 */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    const name = file.name.toLowerCase();

    try {
      if (name.endsWith('.txt') || name.endsWith('.md')) {
        const text = await file.text();
        setInputText(inputText ? inputText + '\n\n' + text : text);
      } else if (name.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer } as unknown as { arrayBuffer: ArrayBuffer });
        const text = result.value;
        if (text.trim()) {
          setInputText(inputText ? inputText + '\n\n' + text : text);
        } else {
          setUploadError('无法从文档中提取文本，文档可能为空');
        }
      } else {
        setUploadError(`不支持的格式：${file.name.split('.').pop()}。支持 .txt .md .docx`);
      }
    } catch (err) {
      console.error('文件读取失败:', err);
      setUploadError('文件读取失败，请重试');
    }

    // 重置 input 以允许重复选同一文件
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalChars = inputText.length;
  const segmentCount = segments.length;

  return (
    <Box className="flex flex-col gap-3">
      <Box className="flex items-center justify-between">
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
          文本输入
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AttachFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          sx={{ textTransform: 'none' }}
        >
          上传文件
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".txt,.md,.docx"
          onChange={handleFileUpload}
        />
      </Box>

      <TextField
        multiline
        rows={10}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={`在此输入或粘贴文本（最多 ${DEFAULTS.MAX_TEXT_LENGTH} 字）...`}
        fullWidth
        variant="outlined"
        inputProps={{ maxLength: DEFAULTS.MAX_TEXT_LENGTH }}
      />

      {/* 统计信息行 */}
      <Box className="flex items-center gap-3 flex-wrap">
        <Box
          className="flex items-center gap-1 cursor-pointer select-none"
          onClick={toggleSplitExpanded}
          sx={{
            py: 0.5,
            px: 1.5,
            borderRadius: 1,
            backgroundColor: '#f3f4f6',
            '&:hover': { backgroundColor: '#e5e7eb' },
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {totalChars}字 · 自动拆为 {segmentCount} 段
          </Typography>
          {isSplitExpanded ? (
            <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          )}
        </Box>

        <FormControl size="small" sx={{ minWidth: 110, ml: 'auto' }}>
          <InputLabel>输出格式</InputLabel>
          <Select
            value={outputFormat}
            label="输出格式"
            onChange={(e) => setOutputFormat(e.target.value as AudioFormat)}
          >
            <MenuItem value={AudioFormat.MP3}>MP3</MenuItem>
            <MenuItem value={AudioFormat.WAV}>WAV</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 上传错误提示 */}
      <Snackbar
        open={!!uploadError}
        autoHideDuration={4000}
        onClose={() => setUploadError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setUploadError('')} severity="error" variant="filled">
          {uploadError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TextInputPanel;

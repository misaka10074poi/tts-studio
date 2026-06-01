/**
 * API 配置弹窗组件
 * 允许用户配置 TTS API 的端点、密钥、并发数、分段字数
 * 配置自动保存到 localStorage
 */

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Slider, IconButton, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';
import { useApiConfigStore } from '../../store/apiConfigStore';
import { DEFAULTS } from '../../utils/constants';

interface ApiConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

const ApiConfigDialog: React.FC<ApiConfigDialogProps> = ({ open, onClose }) => {
  const { config, updateConfig, resetConfig } = useApiConfigStore();

  const [endpoint, setEndpoint] = React.useState(config.endpoint);
  const [apiKey, setApiKey] = React.useState(config.apiKey);
  const [maxConcurrency, setMaxConcurrency] = React.useState(config.maxConcurrency);
  const [splitThreshold, setSplitThreshold] = React.useState(config.splitThreshold);
  const [outputDir, setOutputDir] = React.useState(config.outputDir);

  React.useEffect(() => {
    if (open) {
      setEndpoint(config.endpoint);
      setApiKey(config.apiKey);
      setMaxConcurrency(config.maxConcurrency);
      setSplitThreshold(config.splitThreshold);
      setOutputDir(config.outputDir);
    }
  }, [open, config]);

  const handleSave = (): void => {
    updateConfig({ endpoint, apiKey, maxConcurrency, splitThreshold, outputDir });
    onClose();
  };

  const handleReset = (): void => {
    resetConfig();
    setEndpoint(DEFAULTS.API_ENDPOINT);
    setApiKey(DEFAULTS.API_KEY);
    setMaxConcurrency(DEFAULTS.MAX_CONCURRENCY);
    setSplitThreshold(DEFAULTS.SPLIT_THRESHOLD);
    setOutputDir(DEFAULTS.OUTPUT_DIR);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" className="flex items-center justify-between">
        <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
          API 配置
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box className="flex flex-col gap-5 py-2">

          <TextField
            label="端点地址"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            fullWidth size="small"
            helperText="TTS API 请求端点"
          />

          <TextField
            label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            fullWidth size="small" type="password"
            helperText="Bearer Token，保存到本地 localStorage"
          />

          {/* 分段字数 */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              单段字数上限: {splitThreshold}
            </Typography>
            <Slider
              value={splitThreshold}
              onChange={(_, v) => setSplitThreshold(v as number)}
              min={100} max={1000} step={50}
              marks={[
                { value: 100, label: '100' },
                { value: 300, label: '300' },
                { value: 500, label: '500' },
                { value: 700, label: '700' },
                { value: 1000, label: '1k' },
              ]}
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              实测：100字 ≈10s · 300字 ≈25s · 500字 ≈143s · 超过700字可能超时。推荐 300-400 平衡速度与分段数
            </Typography>
          </Box>

          {/* 并发数 */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              最大并发数: {maxConcurrency}
            </Typography>
            <Slider
              value={maxConcurrency}
              onChange={(_, v) => setMaxConcurrency(v as number)}
              min={1} max={8} step={1}
              marks
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              实测：100 字段落可跑到 8 并发；300 字段落建议 ≤4 并发。推荐 3-4
            </Typography>
          </Box>

          <TextField
            label="输出目录"
            value={outputDir}
            onChange={(e) => setOutputDir(e.target.value)}
            fullWidth size="small"
            helperText="音频保存位置，支持相对路径（相对于 exe 所在目录）"
          />
        </Box>
      </DialogContent>

      <DialogActions className="justify-between px-4">
        <Button startIcon={<RestoreIcon />} onClick={handleReset} color="inherit"
          sx={{ textTransform: 'none' }}>
          恢复默认
        </Button>
        <Box className="flex gap-2">
          <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>取消</Button>
          <Button onClick={handleSave} variant="contained" sx={{ textTransform: 'none' }}>保存</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ApiConfigDialog;

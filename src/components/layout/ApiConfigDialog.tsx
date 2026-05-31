/**
 * API 配置弹窗组件
 * 允许用户配置 TTS API 的端点、密钥和并发数
 * 配置自动保存到 localStorage
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Slider,
  IconButton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';
import { useApiConfigStore } from '../../store/apiConfigStore';
import { DEFAULTS } from '../../utils/constants';

interface ApiConfigDialogProps {
  /** 是否打开弹窗 */
  open: boolean;
  /** 关闭弹窗的回调 */
  onClose: () => void;
}

/** API 配置弹窗组件 */
const ApiConfigDialog: React.FC<ApiConfigDialogProps> = ({ open, onClose }) => {
  const { config, updateConfig, resetConfig } = useApiConfigStore();

  const [endpoint, setEndpoint] = React.useState(config.endpoint);
  const [apiKey, setApiKey] = React.useState(config.apiKey);
  const [maxConcurrency, setMaxConcurrency] = React.useState(config.maxConcurrency);
  const [outputDir, setOutputDir] = React.useState(config.outputDir);

  // 打开弹窗时同步最新配置
  React.useEffect(() => {
    if (open) {
      setEndpoint(config.endpoint);
      setApiKey(config.apiKey);
      setMaxConcurrency(config.maxConcurrency);
      setOutputDir(config.outputDir);
    }
  }, [open, config]);

  /** 保存配置 */
  const handleSave = (): void => {
    updateConfig({ endpoint, apiKey, maxConcurrency, outputDir });
    onClose();
  };

  /** 重置为默认配置 */
  const handleReset = (): void => {
    resetConfig();
    setEndpoint(DEFAULTS.API_ENDPOINT);
    setApiKey(DEFAULTS.API_KEY);
    setMaxConcurrency(DEFAULTS.MAX_CONCURRENCY);
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
          <Alert severity="info" variant="outlined">
            当前默认 Key 适合本机自用；如需公开分发，建议改为首次启动配置。
          </Alert>

          <TextField
            label="端点地址"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            fullWidth
            size="small"
            helperText="TTS API 的请求端点"
          />

          <TextField
            label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            fullWidth
            size="small"
            type="password"
            helperText="Bearer Token 认证密钥，将保存到本机 localStorage"
          />

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              最大并发数: {maxConcurrency}
            </Typography>
            <Slider
              value={maxConcurrency}
              onChange={(_, v) => setMaxConcurrency(v as number)}
              min={1}
              max={5}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              建议 2 路，3 路可能出现瓶颈
            </Typography>
          </Box>

          <TextField
            label="输出目录"
            value={outputDir}
            onChange={(e) => setOutputDir(e.target.value)}
            fullWidth
            size="small"
            helperText="音频保存位置，支持相对路径"
          />
        </Box>
      </DialogContent>

      <DialogActions className="justify-between px-4">
        <Button
          startIcon={<RestoreIcon />}
          onClick={handleReset}
          color="inherit"
          sx={{ textTransform: 'none' }}
        >
          恢复默认
        </Button>
        <Box className="flex gap-2">
          <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            保存
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ApiConfigDialog;

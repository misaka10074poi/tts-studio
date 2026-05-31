/**
 * 首页组件
 * 展示两个入口卡片：内置音色和声音克隆
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Box } from '@mui/material';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/** 首页组件 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box className="max-w-4xl mx-auto py-8">
      <Typography
        variant="h4"
        className="text-center mb-2"
        sx={{ fontWeight: 700, color: '#1a1a2e' }}
      >
        🎙️ 配音工作室
      </Typography>
      <Typography
        variant="body1"
        className="text-center mb-10"
        sx={{ color: '#6b7280' }}
      >
        选择一种方式开始创作
      </Typography>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 内置音色入口 */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          onClick={() => navigate('/builtin')}
          sx={{
            border: '2px solid transparent',
            '&:hover': { borderColor: '#6366F1' },
            borderRadius: 3,
          }}
        >
          <CardContent className="flex flex-col items-center py-10">
            <RecordVoiceOverIcon
              sx={{ fontSize: 64, color: '#6366F1', mb: 2 }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              内置音色
            </Typography>
            <Typography variant="body2" color="text.secondary" className="text-center">
              9 种精心调校的预设音色，覆盖中英文男女声
            </Typography>
            <Typography
              variant="caption"
              sx={{ mt: 2, color: '#6366F1', fontWeight: 500 }}
            >
              即选即用 →
            </Typography>
          </CardContent>
        </Card>

        {/* 声音克隆入口 */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          onClick={() => navigate('/clone')}
          sx={{
            border: '2px solid transparent',
            '&:hover': { borderColor: '#8B5CF6' },
            borderRadius: 3,
          }}
        >
          <CardContent className="flex flex-col items-center py-10">
            <ContentCopyIcon
              sx={{ fontSize: 64, color: '#8B5CF6', mb: 2 }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              声音克隆
            </Typography>
            <Typography variant="body2" color="text.secondary" className="text-center">
              上传音频样本或用文字描述，生成专属音色
            </Typography>
            <Typography
              variant="caption"
              sx={{ mt: 2, color: '#8B5CF6', fontWeight: 500 }}
            >
              自定义音色 →
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default HomePage;

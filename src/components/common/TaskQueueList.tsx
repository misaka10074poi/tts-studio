/**
 * 任务队列列表组件
 * 展示所有任务的执行状态列表
 */

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useTaskQueueStore } from '../../store/taskQueueStore';
import TaskQueueItem from './TaskQueueItem';

interface TaskQueueListProps {
  isGenerating?: boolean;
  onRetryTask?: (taskId: string) => void;
  onRetryFailed?: () => void;
}

/** 任务队列列表组件 */
const TaskQueueList: React.FC<TaskQueueListProps> = ({
  isGenerating = false,
  onRetryTask,
  onRetryFailed,
}) => {
  const { tasks, clearTasks } = useTaskQueueStore();

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const failedCount = tasks.filter((t) => t.status === 'failed').length;
  const totalCount = tasks.length;

  return (
    <Box className="mt-4">
      <Box className="flex items-center justify-between mb-2">
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          任务队列 ({completedCount}/{totalCount} 完成
          {failedCount > 0 && `，${failedCount} 失败`})
        </Typography>
        <Button
          size="small"
          startIcon={<DeleteSweepIcon />}
          onClick={clearTasks}
          disabled={isGenerating}
          color="inherit"
          sx={{ textTransform: 'none' }}
        >
          清空
        </Button>
        {failedCount > 0 && (
          <Button
            size="small"
            onClick={onRetryFailed}
            disabled={isGenerating}
            sx={{ textTransform: 'none' }}
          >
            重试失败项
          </Button>
        )}
      </Box>

      <Box className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {tasks.map((task, index) => (
          <TaskQueueItem
            key={task.id}
            task={task}
            index={index}
            onRetry={onRetryTask}
            retryDisabled={isGenerating}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TaskQueueList;

/**
 * 分段管理器组件
 * 直接渲染 SegmentPreviewPanel（兼容性 wrapper）
 */

import React from 'react';
import SegmentPreviewPanel from './SegmentPreviewPanel';

/** 分段管理器组件 */
const SegmentManager: React.FC = () => <SegmentPreviewPanel />;

export default SegmentManager;

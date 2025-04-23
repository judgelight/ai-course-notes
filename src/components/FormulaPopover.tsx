/**
 * 公式悬浮放大组件
 * 用于在鼠标悬停时显示放大的数学公式
 */

'use client'

import React, { useEffect, useState, useRef } from 'react';
import { parseLatexInText } from '@/lib/latex-utils';

interface FormulaPopoverProps {
  content: string;
  position: { x: number; y: number } | null;
}

export default function FormulaPopover({ content, position }: FormulaPopoverProps) {
  const [visiblePosition, setVisiblePosition] = useState<{ x: number; y: number } | null>(position);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (position) {
      // 设置初始位置
      const x = position.x;
      const y = position.y + 20; // 在鼠标下方20px处显示
      
      // 我们将在渲染后通过ref检测实际大小并调整位置
      
      setVisiblePosition({ x, y });
      setIsVisible(true);
    } else {
      // 添加淡出效果
      setIsVisible(false);
      const timer = setTimeout(() => {
        setVisiblePosition(null);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [position]);
  
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // 在渲染后调整位置，确保不超出屏幕边界
  useEffect(() => {
    if (visiblePosition && popoverRef.current) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const popoverWidth = popoverRect.width;
      const popoverHeight = popoverRect.height;
      
      let x = visiblePosition.x;
      let y = visiblePosition.y;
      
      // 确保不超出右边界
      if (x + popoverWidth > windowWidth - 20) {
        x = windowWidth - popoverWidth - 20;
      }
      
      // 确保不超出下边界
      if (y + popoverHeight > windowHeight - 20) {
        y = visiblePosition.y - popoverHeight - 10; // 在鼠标上方显示
      }
      
      // 确保不超出左边界
      if (x < 20) {
        x = 20;
      }
      
      // 确保不超出上边界
      if (y < 20) {
        y = 20;
      }
      
      if (x !== visiblePosition.x || y !== visiblePosition.y) {
        setVisiblePosition({ x, y });
      }
    }
  }, [visiblePosition, isVisible]);
  
  if (!visiblePosition) return null;
  
  return (
    <div 
      ref={popoverRef}
      className={`fixed z-50 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        left: `${visiblePosition.x}px`,
        top: `${visiblePosition.y}px`,
        maxWidth: '80vw', // 最大宽度为视口宽度的80%
        maxHeight: '80vh', // 最大高度为视口高度的80%
        overflowY: 'auto' // 如果内容过长，允许滚动
      }}
    >
      <div className="formula-popover text-base">
        {parseLatexInText(content)}
      </div>
    </div>
  );
}

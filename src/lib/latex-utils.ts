/**
 * LaTex公式处理工具函数
 */

import React from 'react';
import LatexRenderer from '@/components/LatexRenderer';

/**
 * 解析文本中的LaTex公式并返回React元素数组
 * 支持两种格式的LaTex公式：
 * 1. 行内公式：使用$...$包裹
 * 2. 块级公式：使用$$...$$包裹
 * 
 * @param text 包含LaTex公式的文本
 * @returns React元素数组
 */
export function parseLatexInText(text: string): React.ReactNode[] {
  if (!text) return [text];
  
  // 匹配行内公式 $...$ 和块级公式 $$...$$
  const regex = /(\$\$[^\$]+\$\$|\$[^\$]+\$)/g;
  
  // 分割文本
  const parts = text.split(regex);
  
  // 处理每个部分
  return parts.map((part, index) => {
    // 检查是否是公式
    if (part.startsWith('$$') && part.endsWith('$$')) {
      // 块级公式
      const formula = part.slice(2, -2);
      return React.createElement(LatexRenderer, { 
        key: index, 
        formula: formula, 
        displayMode: true 
      });
    } else if (part.startsWith('$') && part.endsWith('$')) {
      // 行内公式
      const formula = part.slice(1, -1);
      return React.createElement(LatexRenderer, { 
        key: index, 
        formula: formula, 
        displayMode: false 
      });
    } else {
      // 普通文本
      return part;
    }
  });
}

/**
 * 检查文本中是否包含LaTex公式
 * 
 * @param text 要检查的文本
 * @returns 是否包含LaTex公式
 */
export function containsLatex(text: string): boolean {
  if (!text) return false;
  
  // 匹配行内公式 $...$ 和块级公式 $$...$$
  const regex = /(\$\$[^\$]+\$\$|\$[^\$]+\$)/g;
  
  return regex.test(text);
}

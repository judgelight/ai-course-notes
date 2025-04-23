/**
 * 问题渲染组件
 * 用于渲染问卷中的问题
 * 支持LaTex数学公式渲染
 * 支持公式悬浮放大功能
 */

'use client'

import React, { useState } from 'react';
import { parseLatexInText, containsLatex } from '@/lib/latex-utils';
import FormulaPopover from './FormulaPopover';
import 'katex/dist/katex.min.css';

type Lang = 'zh' | 'ja';

interface QuestionOption {
  id: string;
  text: {
    zh: string;
    ja: string;
  };
}

interface Question {
  id: string;
  type: 'single_choice';
  content: {
    zh: string;
    ja: string;
  };
  options: QuestionOption[];
  correct_option?: string;
  explanation?: {
    zh: string;
    ja: string;
  };
  userAnswer?: string;
  isCorrect?: boolean;
}

interface QuestionRendererProps {
  question: Question;
  language: Lang;
  selectedOption: string | null;
  onSelectOption: (questionId: string, optionId: string) => void;
  showResult?: boolean;
  disabled?: boolean;
}

export default function QuestionRenderer({
  question,
  language,
  selectedOption,
  onSelectOption,
  showResult = false,
  disabled = false
}: QuestionRendererProps) {
  // 添加状态来跟踪悬停的选项和悬浮框位置
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleOptionSelect = (optionId: string) => {
    if (disabled) return;
    onSelectOption(question.id, optionId);
  };

  // 鼠标进入选项时的处理函数
  const handleMouseEnter = (optionId: string, optionText: string, event: React.MouseEvent) => {
    // 清除之前的定时器
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    // 只有当选项包含LaTex公式时才显示悬浮框
    if (containsLatex(optionText)) {
      // 添加小延迟，避免鼠标快速经过时频繁显示悬浮框
      const timeout = setTimeout(() => {
        setHoveredOption(optionId);
        setPopoverPosition({ x: event.clientX, y: event.clientY });
      }, 200);
      
      setHoverTimeout(timeout as unknown as NodeJS.Timeout);
    }
  };

  // 鼠标离开选项时的处理函数
  const handleMouseLeave = () => {
    // 清除定时器
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    setHoveredOption(null);
    setPopoverPosition(null);
  };

  // 获取当前语言的内容
  const content = question.content[language];
  
  return (
    <div className="mb-8 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">{parseLatexInText(content)}</h3>
      
      <div className="space-y-2">
        {question.options.map((option) => {
          // 确定选项的样式
          let optionClassName = "flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700";
          
          if (showResult) {
            if (option.id === question.correct_option) {
              // 正确答案
              optionClassName += " bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700";
            } else if (option.id === question.userAnswer && option.id !== question.correct_option) {
              // 用户选择的错误答案
              optionClassName += " bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700";
            }
          } else if (option.id === selectedOption) {
            // 用户当前选择的选项
            optionClassName += " bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700";
          }
          
          if (disabled) {
            optionClassName = optionClassName.replace("cursor-pointer", "cursor-default");
          }
          
          // 获取选项文本
          const optionText = option.text[language];
          
          return (
            <div
              key={option.id}
              className={optionClassName}
              onClick={() => handleOptionSelect(option.id)}
              onMouseEnter={(e) => handleMouseEnter(option.id, optionText, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="mr-3 flex-shrink-0">
                    {showResult ? (
                      option.id === question.correct_option ? (
                        <span className="text-green-500">✓</span>
                      ) : option.id === question.userAnswer ? (
                        <span className="text-red-500">✗</span>
                      ) : (
                        <span className="text-gray-400">○</span>
                      )
                    ) : (
                      <span className={selectedOption === option.id ? "text-blue-500" : "text-gray-400"}>
                        {selectedOption === option.id ? "●" : "○"}
                      </span>
                    )}
                  </div>
                  <div className="text-sm">{parseLatexInText(option.text[language])}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 显示解析 */}
      {showResult && question.explanation && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm font-medium mb-1">
            {language === 'zh' ? '解析:' : '解説:'}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {parseLatexInText(question.explanation[language])}
          </p>
        </div>
      )}
      {/* 悬浮放大框 */}
      {hoveredOption && (
        <FormulaPopover 
          content={question.options.find(opt => opt.id === hoveredOption)?.text[language] || ''}
          position={popoverPosition}
        />
      )}
    </div>
  );
}

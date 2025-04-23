/**
 * 问卷布局组件
 * 用于用户问卷页面的布局
 * 支持LaTex数学公式渲染
 */

'use client'

import React from 'react';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import 'katex/dist/katex.min.css';

type Lang = 'zh' | 'ja';

interface SurveyLayoutProps {
  children: React.ReactNode;
  language: Lang;
  onLanguageChange: (lang: Lang) => void;
}

export default function SurveyLayout({ 
  children, 
  language, 
  onLanguageChange 
}: SurveyLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-blue-600">
                  {language === 'zh' ? 'AI课程网站' : 'AIコース'}
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <LanguageSwitcher 
                language={language} 
                onChange={onLanguageChange} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} {language === 'zh' ? 'AI课程网站' : 'AIコース'}
          </p>
        </div>
      </footer>
    </div>
  );
}

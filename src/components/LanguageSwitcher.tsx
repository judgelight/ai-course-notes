/**
 * 语言切换组件
 * 用于切换中文和日语
 */

'use client'

import React from 'react';
import { Switch } from '@headlessui/react';

type Lang = 'zh' | 'ja';

interface LanguageSwitcherProps {
  language: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}

export default function LanguageSwitcher({ 
  language, 
  onChange,
  className = ''
}: LanguageSwitcherProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={language === 'zh' ? 'text-blue-600 font-medium' : 'text-gray-500 dark:text-gray-400'}>
        中文
      </span>
      <Switch
        checked={language === 'ja'}
        onChange={(checked: boolean) => onChange(checked ? 'ja' : 'zh')}
        className={`${
          language === 'ja' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
      >
        <span className="sr-only">Language</span>
        <span
          className={`${
            language === 'ja' ? 'translate-x-5' : 'translate-x-0'
          } inline-block h-5 w-5 transform bg-white dark:bg-gray-900 rounded-full transition-transform`}
        />
      </Switch>
      <span className={language === 'ja' ? 'text-blue-600 font-medium' : 'text-gray-500 dark:text-gray-400'}>
        日本語
      </span>
    </div>
  );
}

'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Switch } from '@headlessui/react'

interface FileEntry {
  name: string
  file: string
  type: string
}

type Lang = 'zh' | 'ja'

// 页面文案
const texts: Record<Lang, Record<string, string>> = {
  zh: {
    title: '人工智能课程笔记',
    clickToView: '点击查看 {label} 文件',
    download: '下载',
  },
  ja: {
    title: '人工知能コースノート',
    clickToView: '{label} ファイルを表示',
    download: 'ダウンロード',
  },
}

// 文件类型标签
const fileTypeLabels: Record<Lang, Record<string, string>> = {
  zh: { md: 'Markdown', ipynb: 'Jupyter Notebook', py: 'Python', default: '文件' },
  ja: { md: 'マークダウン', ipynb: 'Jupyter ノートブック', py: 'Python', default: 'ファイル' },
}

export default function Home() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [lang, setLang] = useState<Lang>('zh')

  // 读取文件列表
  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(setFiles)
      .catch(() => setFiles([]))
  }, [])

  // 根据浏览器语言初始化
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const code = navigator.language.startsWith('ja') ? 'ja' : 'zh'
      setLang(code)
    }
  }, [])

  const t = texts[lang]

  const getFileTypeInfo = (type: string) => {
    const iconMap: Record<string, string> = {
      md: '📄',
      ipynb: '📊',
      py: '🐍',
    }
    const colorMap: Record<string, string> = {
      md: 'text-blue-600',
      ipynb: 'text-orange-600',
      py: 'text-green-600',
    }
    const label = fileTypeLabels[lang][type] || fileTypeLabels[lang].default
    return { icon: iconMap[type] || '📄', color: colorMap[type] || 'text-gray-600', label }
  }

  return (
    <main className="relative max-w-4xl mx-auto px-4 py-10">
      {/* 语言切换开关 */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <span className={lang === 'zh' ? 'text-blue-600 font-medium' : 'text-gray-500 dark:text-gray-400'}>
          中文
        </span>
        <Switch
          checked={lang === 'ja'}
          onChange={(checked: boolean) => setLang(checked ? 'ja' : 'zh')}
          className={`${
            lang === 'ja' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
        >
          <span className="sr-only">Language</span>
          <span
            className={`${
              lang === 'ja' ? 'translate-x-5' : 'translate-x-0'
            } inline-block h-5 w-5 transform bg-white dark:bg-gray-900 rounded-full transition-transform`}
          />
        </Switch>
        <span className={lang === 'ja' ? 'text-blue-600 font-medium' : 'text-gray-500 dark:text-gray-400'}>
          日本語
        </span>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-center">{t.title}</h1>
      <div className="grid gap-4">
        {files.map((file, idx) => {
          const { icon, color, label } = getFileTypeInfo(file.type)
          const viewText = t.clickToView.replace('{label}', label)
          return (
            <div
              key={idx}
              className="p-4 rounded-lg border shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition space-y-2"
            >
              <Link
                href={`/viewer?file=${encodeURIComponent(file.file)}`}
                target="_blank"
                className={`text-xl font-semibold ${color} hover:underline flex items-center gap-2`}
              >
                <span>{icon}</span>
                <span>{file.name}</span>
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
                <span>{viewText}</span>
                <a
                  href={`/markdown/${encodeURIComponent(file.file)}`}
                  download
                  className="text-sm text-blue-500 hover:underline dark:text-blue-400"
                >
                  {t.download}
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

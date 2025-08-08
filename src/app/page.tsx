'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Switch } from '@headlessui/react'

type LessonFile = {
  name: string
  file: string
  type: string
}

type Lesson = {
  lesson: number
  titles: { zh?: string; ja?: string }
  files: {
    zh?: LessonFile
    ja?: LessonFile
    ipynb: LessonFile[]
  }
}

type Lang = 'zh' | 'ja'

// 页面文案
const texts: Record<Lang, Record<string, string>> = {
  zh: {
    title: '人工智能课程笔记',
    clickToView: '点击查看 {label} 文件',
    download: '下载',
    surveyTitle: '问卷系统',
    surveyDesc: '参与课程问卷调查，测试你的知识',
    goToSurvey: '前往问卷',
    lessonHas: '包含',
    zh: '中文',
    ja: '日文',
    notebook: 'Notebook',
    goToCourse: '查看课程',
  },
  ja: {
    title: '人工知能コースノート',
    clickToView: '{label} ファイルを表示',
    download: 'ダウンロード',
    surveyTitle: 'アンケートシステム',
    surveyDesc: 'コースアンケートに参加して、あなたの知識をテストしましょう',
    goToSurvey: 'アンケートへ',
    lessonHas: '含む',
    zh: '中文',
    ja: '日本語',
    notebook: 'ノートブック',
    goToCourse: 'コースを見る',
  },
}

export default function Home() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lang, setLang] = useState<Lang>('zh')

  // 读取课程列表
  useEffect(() => {
    fetch('/api/lessons')
      .then(res => res.json())
      .then(setLessons)
      .catch(() => setLessons([]))
  }, [])

  // 根据浏览器语言或本地存储初始化（优先使用用户上次选择）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('site_lang')
      if (saved === 'ja' || saved === 'zh') {
        setLang(saved)
        return
      }
      const code = typeof navigator !== 'undefined' && navigator.language?.startsWith('ja') ? 'ja' : 'zh'
      setLang(code)
    }
  }, [])

  const t = texts[lang]

  return (
    <main className="relative max-w-4xl mx-auto px-4 py-10">
      {/* 语言切换开关 */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <span className={lang === 'zh' ? 'text-blue-600 font-medium' : 'text-gray-500 dark:text-gray-400'}>
          中文
        </span>
        <Switch
          checked={lang === 'ja'}
          onChange={(checked: boolean) => {
            const newLang = checked ? 'ja' : 'zh'
            setLang(newLang)
            try {
              localStorage.setItem('site_lang', newLang)
            } catch (e) {
              // ignore storage errors
            }
          }}
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

      <div className="grid gap-4 mb-8">
        {lessons.map((lesson) => {
          const title = lang === 'ja' ? lesson.titles.ja || lesson.titles.zh : lesson.titles.zh || lesson.titles.ja
          const hasZh = !!lesson.files.zh
          const hasJa = !!lesson.files.ja
          const nbCount = lesson.files.ipynb?.length || 0

          return (
            <div
              key={lesson.lesson}
              className="p-4 rounded-lg border shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/lessons/${lesson.lesson}`}
                  className="text-xl font-semibold text-gray-800 dark:text-gray-100 hover:underline flex items-center gap-2"
                >
                  <span className="text-sm text-gray-500">第{lesson.lesson}课</span>
                  <span>{title || `Lesson ${lesson.lesson}`}</span>
                </Link>
                <Link
                  href={`/lessons/${lesson.lesson}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  {t.goToCourse}
                </Link>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
                <span>
                  {t.lessonHas}:
                  {hasZh && <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{t.zh}</span>}
                  {hasJa && <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{t.ja}</span>}
                  {nbCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      {t.notebook} x{nbCount}
                    </span>
                  )}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 问卷系统入口 */}
      <div className="mt-12 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-2">
              {t.surveyTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 md:mb-0">
              {t.surveyDesc}
            </p>
          </div>
          <Link
            href="/surveys"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {t.goToSurvey}
          </Link>
        </div>
      </div>
    </main>
  )
}

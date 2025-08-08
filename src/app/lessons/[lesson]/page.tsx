'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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

const texts: Record<Lang, Record<string, string>> = {
  zh: {
    titlePrefix: '第',
    titleSuffix: '课',
    zh: '中文',
    ja: '日文',
    notebook: 'Notebook',
    view: '查看',
    download: '下载',
    back: '返回课程列表',
  },
  ja: {
    titlePrefix: '第',
    titleSuffix: '課',
    zh: '中文',
    ja: '日本語',
    notebook: 'ノートブック',
    view: '表示',
    download: 'ダウンロード',
    back: 'コース一覧に戻る',
  },
}

export default function LessonPageClient() {
  const params = useParams()
  const lessonParam = params?.lesson || ''
  const lessonNum = Number(lessonParam || 0)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [lang, setLang] = useState<Lang>('zh')

  useEffect(() => {
    // init language from browser
    if (typeof navigator !== 'undefined') {
      const code = navigator.language.startsWith('ja') ? 'ja' : 'zh'
      setLang(code)
    }
  }, [])

  useEffect(() => {
    if (!lessonNum) return
    fetch('/api/lessons')
      .then((res) => res.json())
      .then((data: Lesson[]) => {
        const found = data.find((l) => l.lesson === lessonNum)
        setLesson(found || null)
      })
      .catch(() => setLesson(null))
  }, [lessonNum])

  const t = texts[lang]

  if (!lesson) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-gray-600">未找到第 {lessonNum} 课的内容或正在加载中...</p>
        <div className="mt-4">
          <Link href="/" className="text-blue-600 hover:underline">
            {t.back}
          </Link>
        </div>
      </main>
    )
  }

  const title = lang === 'ja' ? lesson.titles.ja || lesson.titles.zh : lesson.titles.zh || lesson.titles.ja

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t.titlePrefix}{lesson.lesson}{t.titleSuffix} — {title || `Lesson ${lesson.lesson}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {lesson.files.zh ? t.zh : ''} {lesson.files.ja ? `・ ${t.ja}` : ''} {lesson.files.ipynb.length ? `・ ${t.notebook} x${lesson.files.ipynb.length}` : ''}
          </p>
        </div>
        <div>
          <Link href="/" className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">
            {t.back}
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {lesson.files.zh && (
          <div className="p-4 rounded border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">{t.zh}</div>
                <div className="text-sm text-gray-500">{lesson.files.zh.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/viewer?file=${encodeURIComponent(lesson.files.zh.file)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  {t.view}
                </a>
                <a
                  href={`/markdown/${encodeURIComponent(lesson.files.zh.file)}`}
                  download
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t.download}
                </a>
              </div>
            </div>
          </div>
        )}

        {lesson.files.ja && (
          <div className="p-4 rounded border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">{t.ja}</div>
                <div className="text-sm text-gray-500">{lesson.files.ja.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/viewer?file=${encodeURIComponent(lesson.files.ja.file)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  {t.view}
                </a>
                <a
                  href={`/markdown/${encodeURIComponent(lesson.files.ja.file)}`}
                  download
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t.download}
                </a>
              </div>
            </div>
          </div>
        )}

        {lesson.files.ipynb && lesson.files.ipynb.length > 0 && (
          <div className="p-4 rounded border">
            <div className="text-lg font-medium mb-2">{t.notebook}</div>
            <div className="space-y-2">
              {lesson.files.ipynb.map((nb) => (
                <div key={nb.file} className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">{nb.name}</div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/viewer?file=${encodeURIComponent(nb.file)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      {t.view}
                    </a>
                    <a href={`/markdown/${encodeURIComponent(nb.file)}`} download className="text-sm text-blue-600 hover:underline">
                      {t.download}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

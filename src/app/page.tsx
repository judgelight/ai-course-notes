'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface FileEntry {
  name: string
  file: string
  type: string
}

export default function Home() {
  const [files, setFiles] = useState<FileEntry[]>([])

  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(setFiles)
      .catch(() => {
        setFiles([])
      })
  }, [])

  // 根据文件类型返回图标和颜色
  const getFileTypeInfo = (type: string) => {
    switch (type) {
      case 'md':
        return { icon: '📄', color: 'text-blue-600', label: 'Markdown' }
      case 'ipynb':
        return { icon: '📊', color: 'text-orange-600', label: 'Jupyter Notebook' }
      case 'py':
        return { icon: '🐍', color: 'text-green-600', label: 'Python' }
      default:
        return { icon: '📄', color: 'text-gray-600', label: '文件' }
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">人工智能课程笔记</h1>
      <div className="grid gap-4">
        {files.map((file, idx) => {
          const { icon, color, label } = getFileTypeInfo(file.type)
          return (
            <div
              key={idx}
              className="p-4 rounded-lg border shadow-sm hover:bg-gray-50 transition space-y-2"
            >
              <Link
                href={`/viewer?file=${encodeURIComponent(file.file)}`}
                target="_blank"
                className={`text-xl font-semibold ${color} hover:underline flex items-center gap-2`}
              >
                <span>{icon}</span>
                <span>{file.name}</span>
              </Link>
              <div className="text-sm text-gray-500 flex items-center gap-4">
                <span>点击查看 {label} 文件</span>
                <a
                  href={`/markdown/${encodeURIComponent(file.file)}`}
                  download
                  className="text-sm text-blue-500 hover:underline"
                >
                  下载
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

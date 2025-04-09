'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface FileEntry {
  name: string
  file: string
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

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">人工智能课程笔记</h1>
      <div className="grid gap-4">
        {files.map((file, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg border shadow-sm hover:bg-gray-50 transition space-y-2"
          >
            <Link
              href={`/viewer?file=${encodeURIComponent(file.file)}`}
              target="_blank"
              className="text-xl font-semibold text-blue-600 hover:underline"
            >
              {file.name}
            </Link>
            <div className="text-sm text-gray-500 flex items-center gap-4">
              <span>点击查看 Markdown 文件</span>
              <a
                href={`/markdown/${encodeURIComponent(file.file)}`}
                download
                className="text-sm text-blue-500 hover:underline"
              >
                下载
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
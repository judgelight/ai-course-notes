'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'

import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'

export default function Viewer() {
  const searchParams = useSearchParams()
  const file = searchParams.get('file')
  const [content, setContent] = useState('⏳ 正在加载...')

  useEffect(() => {
    if (!file) {
      setContent('❗ 未指定文件名')
      return
    }

    fetch(`/markdown/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error('加载失败')
        return res.text()
      })
      .then((text) => setContent(text))
      .catch(() => setContent('❌ 无法加载 Markdown 文件'))
  }, [file])

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">📄 {file}</h1>
      <article className="prose prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </article>
    </main>
  )
}

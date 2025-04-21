'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import remarkUnwrapImages from 'remark-unwrap-images'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import dynamic from 'next/dynamic'

// 动态导入IpynbViewer组件，禁用SSR
const IpynbViewer = dynamic(() => import('./IpynbViewer'), { ssr: false })

// 导入GitHub风格的Markdown CSS
import 'github-markdown-css/github-markdown-light.css'
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'

export default function Viewer() {
  const searchParams = useSearchParams()
  const file = searchParams.get('file')
  const [content, setContent] = useState('⏳ 正在加载...')
  const [fileType, setFileType] = useState<string>('md')
  const [notebookData, setNotebookData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!file) {
      setContent('❗ 未指定文件名')
      return
    }

    // 根据文件扩展名设置文件类型
    if (file.endsWith('.ipynb')) {
      setFileType('ipynb')
    } else if (file.endsWith('.py')) {
      setFileType('py')
    } else {
      setFileType('md')
    }

    fetch(`/markdown/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error('加载失败')
        return res.text()
      })
      .then((text) => {
        if (fileType === 'ipynb') {
          try {
            // 解析JSON格式的notebook数据
            setNotebookData(JSON.parse(text))
          } catch (error) {
            console.error('解析Jupyter Notebook文件失败:', error)
            setContent('❌ 无法解析Jupyter Notebook文件')
          }
        } else {
          setContent(text)
        }
      })
      .catch(() => setContent(`❌ 无法加载${fileType === 'md' ? 'Markdown' : fileType === 'ipynb' ? 'Jupyter Notebook' : 'Python'}文件`))
  }, [file, fileType])

  // 根据文件类型渲染不同的内容
  const renderContent = () => {
    switch (fileType) {
      case 'md':
        return (
          <article className="markdown-body prose prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath, remarkUnwrapImages]}
              rehypePlugins={[rehypeRaw, rehypeHighlight, [rehypeKatex, { output: 'htmlAndMathml' }]]}
            >
              {content}
            </ReactMarkdown>
          </article>
        )
      case 'ipynb':
        return (
          <IpynbViewer notebookData={notebookData} />
        )
      case 'py':
        return (
          <div className="code-container markdown-body">
            <SyntaxHighlighter language="python" style={vscDarkPlus} showLineNumbers>
              {content}
            </SyntaxHighlighter>
          </div>
        )
      default:
        return <div>不支持的文件类型</div>
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">
        {fileType === 'md' ? '📄' : fileType === 'ipynb' ? '📊' : '🐍'} {file}
      </h1>
      {renderContent()}
    </main>
  )
}

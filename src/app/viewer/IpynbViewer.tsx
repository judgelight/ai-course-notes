'use client'

import { useEffect, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useSearchParams } from 'next/navigation'

interface IpynbViewerProps {
  notebookData: Record<string, unknown> | null
}

export default function IpynbViewer({ notebookData }: IpynbViewerProps) {
  const searchParams = useSearchParams()
  const file = searchParams.get('file')
  const [isMounted, setIsMounted] = useState(false)
  const [formattedContent, setFormattedContent] = useState<string>('')

  // 生成Google Colab URL
  const getColabUrl = () => {
    if (!isMounted) return '#';
    
    try {
      // 构建当前文件的完整URL（仅在客户端执行）
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const fileUrl = `${baseUrl}/markdown/${file}`;
      
      // 构建Colab URL - 使用直接导入URL的方式
      return `https://colab.research.google.com/notebook#create=true&url=${encodeURIComponent(fileUrl)}`;
    } catch (error) {
      console.error('生成Colab URL失败:', error);
      return '#';
    }
  }

  useEffect(() => {
    setIsMounted(true)
    
    if (notebookData) {
      // 格式化Jupyter Notebook数据为可读的JSON字符串
      setFormattedContent(JSON.stringify(notebookData, null, 2))
      
      // 定义Jupyter Notebook单元格和输出的类型
      interface NotebookCell {
        cell_type: string;
        source: string | string[];
        outputs?: NotebookOutput[];
      }
      
      interface NotebookOutput {
        text?: string | string[];
        data?: {
          'text/plain'?: string | string[];
          [key: string]: unknown;
        };
        [key: string]: unknown;
      }
      
      // 尝试提取并显示单元格内容
      try {
        const cells = notebookData.cells as NotebookCell[]
        if (cells && Array.isArray(cells)) {
          const extractedContent = cells.map((cell, index) => {
            const cellType = cell.cell_type
            const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
            
            let output = ''
            if (cell.outputs && Array.isArray(cell.outputs)) {
              output = cell.outputs.map((out: NotebookOutput) => {
                if (out.text) return Array.isArray(out.text) ? out.text.join('') : out.text
                if (out.data && out.data['text/plain']) 
                  return Array.isArray(out.data['text/plain']) 
                    ? out.data['text/plain'].join('') 
                    : out.data['text/plain']
                return ''
              }).join('\n')
            }
            
            return `--- 单元格 ${index + 1} (${cellType}) ---\n${source}\n\n${output ? `输出:\n${output}\n` : ''}`
          }).join('\n\n')
          
          setFormattedContent(extractedContent)
        }
      } catch (error) {
        console.error('解析Jupyter Notebook单元格失败:', error)
      }
    }
  }, [notebookData, file])

  if (!isMounted || !notebookData) {
    return <div className="jupyter-notebook markdown-body">加载Jupyter Notebook中...</div>
  }

  return (
    <div className="jupyter-notebook markdown-body">
      <div className="flex justify-between items-center mb-4">
        <h2>Jupyter Notebook 内容</h2>
        <a 
          href={getColabUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          在 Google Colab 中打开
        </a>
      </div>
      <SyntaxHighlighter language="json" style={vscDarkPlus} showLineNumbers>
        {formattedContent}
      </SyntaxHighlighter>
    </div>
  )
}

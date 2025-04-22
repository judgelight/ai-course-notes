'use client'

import { useEffect, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface IpynbViewerProps {
  notebookData: Record<string, unknown> | null
}

interface NotebookCell {
  cell_type: string
  source: string | string[]
  outputs?: NotebookOutput[]
}

interface NotebookOutput {
  text?: string | string[]
  data?: {
    'text/plain'?: string | string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

export default function IpynbViewer({ notebookData }: IpynbViewerProps) {
  const [cells, setCells] = useState<NotebookCell[]>([])

  useEffect(() => {
    if (notebookData && Array.isArray(notebookData.cells)) {
      setCells(notebookData.cells as NotebookCell[])
    }
  }, [notebookData])

  if (!notebookData) {
    return <div className="jupyter-notebook markdown-body">加载 Jupyter Notebook 中...</div>
  }

  return (
    <div className="jupyter-notebook markdown-body">
      <h2 className="text-xl font-bold mb-4">Jupyter Notebook 内容</h2>
      {cells.map((cell, idx) => {
        const sourceText = Array.isArray(cell.source) ? cell.source.join('') : cell.source
        const outputs = cell.outputs?.map((out, i) => {
          let text = ''
          if (out.text) {
            text = Array.isArray(out.text) ? out.text.join('') : out.text
          } else if (out.data && out.data['text/plain']) {
            const d = out.data['text/plain']
            text = Array.isArray(d) ? d.join('') : d as string
          }
          return (
            <div key={i} className="mb-4">
              <pre>{text}</pre>
            </div>
          )
        }) ?? []

        return (
          <section key={idx} className="mb-8">
            <h3 className="font-semibold text-sm mb-2">
              单元格 {idx + 1} - {cell.cell_type}
            </h3>
            <SyntaxHighlighter language="python" style={vscDarkPlus}>
              {sourceText}
            </SyntaxHighlighter>
            {outputs.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-sm mb-2">输出：</p>
                {outputs}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

/**
 * LaTex公式渲染组件
 * 用于在问卷系统中渲染数学公式
 */

'use client'

import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useEffect, useRef } from 'react'

interface LatexRendererProps {
  formula: string
  displayMode?: boolean
  className?: string
}

export default function LatexRenderer({ formula, displayMode = false, className = '' }: LatexRendererProps) {
  // 使用span而不是div，这样可以在p标签内使用
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: displayMode,
          throwOnError: false,
          output: 'html'
        })
      } catch (error) {
        console.error('KaTeX渲染错误:', error)
        containerRef.current.textContent = formula
      }
    }
  }, [formula, displayMode])

  return <span ref={containerRef} className={`latex-formula ${className}`} />
}

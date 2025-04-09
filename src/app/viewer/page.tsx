import { Suspense } from 'react'
import MarkdownViewer from './viewer-client'

export default function ViewerPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <MarkdownViewer />
    </Suspense>
  )
}

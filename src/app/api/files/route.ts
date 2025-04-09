import { NextResponse } from 'next/server'
import path from 'path'
import { readdirSync } from 'fs'

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'markdown')

  // 读取 markdown 目录下所有 .md 文件
  const files = readdirSync(dir).filter((file) => file.endsWith('.md'))

  // 映射为展示格式：文件名去扩展名，保留原文件名
  const response = files.map((file) => ({
    name: file.replace(/\\.md$/, ''),
    file,
  }))

  return NextResponse.json(response)
}

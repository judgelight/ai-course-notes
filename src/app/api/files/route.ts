import { NextResponse } from 'next/server'
import path from 'path'
import { readdirSync } from 'fs'

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'markdown')

  // 读取目录下所有.md、.ipynb和.py文件
  const files = readdirSync(dir).filter((file) => 
    file.endsWith('.md') || file.endsWith('.ipynb') || file.endsWith('.py')
  )

  // 映射为展示格式：文件名去扩展名，保留原文件名
  const response = files.map((file) => {
    const extension = path.extname(file)
    return {
      name: file.replace(extension, ''),
      file,
      type: extension.substring(1) // 去掉点号，如'.md' -> 'md'
    }
  })

  return NextResponse.json(response)
}

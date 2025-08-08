import { NextResponse } from 'next/server'
import path from 'path'
import { readdirSync } from 'fs'

type LessonFile = {
  name: string
  file: string
  type: string
}

type Lesson = {
  lesson: number
  titles: { zh?: string; ja?: string }
  files: {
    zh?: LessonFile
    ja?: LessonFile
    ipynb: LessonFile[]
  }
}

function detectLanguage(baseName: string): 'ja' | 'zh' | 'unknown' {
  // 优先检测显式后缀 _jp
  if (/_jp$/i.test(baseName)) return 'ja'
  // 如果包含日文假名或片假名，则视为日文（仅使用假名判定，避免把汉字误判为日文）
  const hiraganaKatakanaRegex = /[\u3040-\u309F\u30A0-\u30FF]/u
  if (hiraganaKatakanaRegex.test(baseName)) return 'ja'
  // 如果包含中文常用汉字，则视为中文
  const zhRegex = /[\u4E00-\u9FFF]/u
  if (zhRegex.test(baseName)) return 'zh'
  // 其他情况无法判断
  return 'unknown'
}

function stripLessonPrefix(name: string) {
  // 去掉起始的数字和分隔符：如 "1. 导引课", "2_Multivariate_...", "10-Title"
  const m = name.match(/^(\d+)[\._\s-]+(.*)$/)
  if (m) return { lesson: Number(m[1]), titlePart: m[2] }
  const m2 = name.match(/^(\d+)(.*)$/)
  if (m2) return { lesson: Number(m2[1]), titlePart: m2[2].replace(/^[_\s-]+/, '') }
  // 如果无法匹配，归为 lesson 0
  return { lesson: 0, titlePart: name }
}

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'markdown')
  let files: string[] = []
  try {
    files = readdirSync(dir).filter((file) =>
      file.endsWith('.md') || file.endsWith('.ipynb') || file.endsWith('.py')
    )
  } catch (err) {
    return NextResponse.json({ error: 'cannot read markdown directory', details: String(err) }, { status: 500 })
  }

  const lessonsMap = new Map<number, Lesson>()

  for (const file of files) {
    const extension = path.extname(file) // .md / .ipynb / .py
    const baseName = file.replace(extension, '') // 去掉扩展名
    const { lesson, titlePart } = stripLessonPrefix(baseName)
    const lang = detectLanguage(baseName) // ja / zh / unknown
    const fileEntry: LessonFile = {
      name: baseName,
      file,
      type: extension.substring(1),
    }

    // ensure lesson entry exists
    if (!lessonsMap.has(lesson)) {
      lessonsMap.set(lesson, {
        lesson,
        titles: {},
        files: { ipynb: [] },
      })
    }
    const lessonObj = lessonsMap.get(lesson)!
    // 分配到对应槽
    if (fileEntry.type === 'md') {
      // 处理 title：去除可能的 _jp 后缀并修剪空白
      const cleanTitle = titlePart.replace(/_jp$/i, '').trim()
      if (lang === 'ja') {
        lessonObj.titles.ja = cleanTitle
        lessonObj.files.ja = fileEntry
      } else if (lang === 'zh') {
        lessonObj.titles.zh = cleanTitle
        lessonObj.files.zh = fileEntry
      } else {
        // unknown: 尽量将不同的 md 分配到 zh/ja 两个槽，避免把同一文件设置到两个语言槽。
        // 优先填充 zh，如果已占用则尝试填充 ja（且确保不是同一个文件）。
        if (!lessonObj.files.zh) {
          lessonObj.titles.zh = cleanTitle
          lessonObj.files.zh = fileEntry
        } else if (!lessonObj.files.ja && lessonObj.files.zh.file !== fileEntry.file) {
          lessonObj.titles.ja = cleanTitle
          lessonObj.files.ja = fileEntry
        } else {
          // 如果两个槽已占用或文件与已存在文件相同，则只保证 title 至少有值（不覆盖文件槽）
          lessonObj.titles.zh = lessonObj.titles.zh || cleanTitle
          lessonObj.titles.ja = lessonObj.titles.ja || cleanTitle
        }
      }
    } else if (fileEntry.type === 'ipynb') {
      lessonObj.files.ipynb.push(fileEntry)
    } else {
      // For other types (py etc) - ignore for lesson listing for now, but could be extended
    }
  }

  // Convert map to array and sort by lesson desc (最新在前)
  const lessons = Array.from(lessonsMap.values())
    .sort((a, b) => b.lesson - a.lesson)
    .map((l) => {
      // If titles missing, try to fill from counterpart or from filename
      if (!l.titles.zh && l.files.ja) {
        l.titles.zh = l.titles.ja
      }
      if (!l.titles.ja && l.files.zh) {
        l.titles.ja = l.titles.zh
      }
      return l
    })

  return NextResponse.json(lessons)
}

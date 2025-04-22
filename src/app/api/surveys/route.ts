/**
 * AI课程网站问卷功能用户问卷API
 * 用于获取已发布的问卷列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/config';

/**
 * 获取已发布的问卷列表
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const db = getDb();
    const surveys = await db.getSurveys(true); // 只获取已发布的问卷
    
    // 转换为前端友好格式
    const formattedSurveys = surveys.map(survey => ({
      id: survey.id,
      title: {
        zh: survey.title_zh,
        ja: survey.title_ja
      },
      description: {
        zh: survey.description_zh,
        ja: survey.description_ja
      },
      created_at: survey.created_at,
      question_count: JSON.parse(survey.questions).length
    }));
    
    return NextResponse.json(formattedSurveys);
  } catch (error) {
    console.error('获取问卷列表失败:', error);
    return NextResponse.json({ error: '获取问卷列表失败' }, { status: 500 });
  }
}

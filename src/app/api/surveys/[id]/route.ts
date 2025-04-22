/**
 * AI课程网站问卷功能用户问卷详情API
 * 用于获取问卷详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/config';

/**
 * 获取问卷详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const db = getDb();
  
  try {
    const survey = await db.getSurvey(id);
    if (!survey) {
      return NextResponse.json({ error: '问卷不存在' }, { status: 404 });
    }
    
    if (!survey.is_published) {
      return NextResponse.json({ error: '问卷未发布' }, { status: 403 });
    }
    
    // 解析问题JSON，但移除正确答案和解析
    const questions = JSON.parse(survey.questions).map((q: any) => {
      const { correct_option, explanation, ...rest } = q;
      return rest;
    });
    
    // 转换为前端友好格式
    const formattedSurvey = {
      id: survey.id,
      title: {
        zh: survey.title_zh,
        ja: survey.title_ja
      },
      description: {
        zh: survey.description_zh,
        ja: survey.description_ja
      },
      questions
    };
    
    return NextResponse.json(formattedSurvey);
  } catch (error) {
    console.error('获取问卷详情失败:', error);
    return NextResponse.json({ error: '获取问卷详情失败' }, { status: 500 });
  }
}

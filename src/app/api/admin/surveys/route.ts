/**
 * AI课程网站问卷功能管理员问卷API
 * 用于获取问卷列表和创建问卷
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/auth';
import { getDb } from '@/lib/db/config';
import { validateSurveyData } from '@/lib/surveys/utils';

/**
 * 获取所有问卷列表
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return adminAuthMiddleware(request, async () => {
    try {
      const db = getDb();
      const surveys = await db.getSurveys();
      
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
        updated_at: survey.updated_at,
        is_published: survey.is_published,
        question_count: JSON.parse(survey.questions).length
      }));
      
      return NextResponse.json(formattedSurveys);
    } catch (error) {
      console.error('获取问卷列表失败:', error);
      return NextResponse.json({ error: '获取问卷列表失败' }, { status: 500 });
    }
  });
}

/**
 * 上传并创建新问卷
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return adminAuthMiddleware(request, async () => {
    try {
      const data = await request.json();
      
      // 验证问卷数据
      const validation = validateSurveyData(data);
      if (!validation.valid || !validation.data) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      
      // 准备问卷数据
      const survey = {
        title_zh: validation.data.title.zh,
        title_ja: validation.data.title.ja,
        description_zh: validation.data.description?.zh || '',
        description_ja: validation.data.description?.ja || '',
        questions: JSON.stringify(validation.data.questions),
        is_published: false // 默认未发布
      };
      
      // 创建问卷
      const db = getDb();
      const id = await db.createSurvey(survey);
      
      // 构建问卷链接
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const surveyUrl = `${appUrl}/surveys/${id}`;
      
      return NextResponse.json({ 
        success: true, 
        id, 
        url: surveyUrl,
        message: '问卷创建成功' 
      });
    } catch (error) {
      console.error('创建问卷失败:', error);
      return NextResponse.json({ error: '创建问卷失败' }, { status: 500 });
    }
  });
}

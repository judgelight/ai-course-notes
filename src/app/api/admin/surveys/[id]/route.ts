/**
 * AI课程网站问卷功能管理员问卷详情API
 * 用于获取、更新和删除问卷
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/auth';
import { getDb } from '@/lib/db/config';

/**
 * 获取问卷详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return adminAuthMiddleware(request, async () => {
    const { id } = params;
    const db = getDb();
    
    try {
      const survey = await db.getSurvey(id);
      if (!survey) {
        return NextResponse.json({ error: '问卷不存在' }, { status: 404 });
      }
      
      // 解析问题JSON
      const questions = JSON.parse(survey.questions);
      
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
        questions,
        created_at: survey.created_at,
        updated_at: survey.updated_at,
        is_published: survey.is_published
      };
      
      return NextResponse.json(formattedSurvey);
    } catch (error) {
      console.error('获取问卷详情失败:', error);
      return NextResponse.json({ error: '获取问卷详情失败' }, { status: 500 });
    }
  });
}

/**
 * 更新问卷状态
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return adminAuthMiddleware(request, async () => {
    const { id } = params;
    const db = getDb();
    
    try {
      // 检查问卷是否存在
      const survey = await db.getSurvey(id);
      if (!survey) {
        return NextResponse.json({ error: '问卷不存在' }, { status: 404 });
      }
      
      const data = await request.json();
      
      // 更新问卷
      await db.updateSurvey(id, {
        is_published: data.is_published
      });
      
      // 构建问卷链接
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const surveyUrl = `${appUrl}/surveys/${id}`;
      
      return NextResponse.json({ 
        success: true, 
        id,
        url: surveyUrl,
        is_published: data.is_published,
        message: `问卷${data.is_published ? '发布' : '取消发布'}成功` 
      });
    } catch (error) {
      console.error('更新问卷状态失败:', error);
      return NextResponse.json({ error: '更新问卷状态失败' }, { status: 500 });
    }
  });
}

/**
 * 删除问卷
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return adminAuthMiddleware(request, async () => {
    const { id } = params;
    const db = getDb();
    
    try {
      // 检查问卷是否存在
      const survey = await db.getSurvey(id);
      if (!survey) {
        return NextResponse.json({ error: '问卷不存在' }, { status: 404 });
      }
      
      // 删除问卷
      await db.deleteSurvey(id);
      
      return NextResponse.json({ 
        success: true, 
        message: '问卷删除成功' 
      });
    } catch (error) {
      console.error('删除问卷失败:', error);
      return NextResponse.json({ error: '删除问卷失败' }, { status: 500 });
    }
  });
}

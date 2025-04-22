/**
 * AI课程网站问卷功能用户提交检查API
 * 用于检查用户是否提交过问卷（仅用于显示提示，不限制提交）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/config';
import { generateClientId } from '@/lib/surveys/utils';

/**
 * 检查用户是否提交过问卷
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;
  const db = getDb();
  
  try {
    // 检查问卷是否存在
    const survey = await db.getSurvey(id);
    if (!survey) {
      return NextResponse.json({ error: '问卷不存在' }, { status: 404 });
    }
    
    if (!survey.is_published) {
      return NextResponse.json({ error: '问卷未发布' }, { status: 403 });
    }
    
    // 生成客户端ID
    const clientId = generateClientId(request);
    
    // 检查是否曾经提交过（不限时间）
    const hasSubmitted = await db.hasSubmittedSurvey(id, clientId);
    const hours = Number(process.env.SUBMISSION_LIMIT_HOURS || 1);
    
    return NextResponse.json({ 
      hasSubmitted,
      hours,
      surveyId: id
    });
  } catch (error) {
    console.error('检查提交记录失败:', error);
    return NextResponse.json({ error: '检查提交记录失败' }, { status: 500 });
  }
}

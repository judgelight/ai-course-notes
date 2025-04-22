/**
 * AI课程网站问卷功能用户问卷提交API
 * 用于提交问卷答案
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/config';
import { generateClientId, calculateScore } from '@/lib/surveys/utils';

/**
 * 提交问卷答案
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
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
    
    // 获取提交的答案
    const { answers, language } = await request.json();
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: '答案格式不正确' }, { status: 400 });
    }
    
    if (!language || (language !== 'zh' && language !== 'ja')) {
      return NextResponse.json({ error: '语言参数不正确' }, { status: 400 });
    }
    
    // 解析问题
    const questions = JSON.parse(survey.questions);
    
    // 计算得分
    const result = calculateScore(questions, answers);
    
    // 检查用户是否已经提交过该问卷（不限时间）
    const hasSubmittedEver = await db.hasSubmittedSurvey(id, clientId);
    
    // 只有第一次提交才保存记录
    let submissionId = '';
    if (!hasSubmittedEver) {
      // 保存提交记录
      const submission = {
        survey_id: id,
        answers: JSON.stringify(answers),
        score: result.score,
        language,
        client_id: clientId
      };
      
      submissionId = await db.createSubmission(submission);
    } else {
      // 如果已经提交过，生成一个临时ID
      submissionId = `temp-${Date.now()}`;
    }
    
    // 准备返回结果，包含正确答案和解析
    const questionsWithAnswers = questions.map((q: any) => {
      const detail = result.details.find(d => d.questionId === q.id);
      return {
        ...q,
        userAnswer: detail?.userAnswer || '',
        isCorrect: detail?.correct || false
      };
    });
    
    return NextResponse.json({
      success: true,
      submissionId,
      score: result.score,
      total: result.total,
      percentage: Math.round((result.score / result.total) * 100),
      questions: questionsWithAnswers
    });
  } catch (error) {
    console.error('提交问卷答案失败:', error);
    return NextResponse.json({ error: '提交问卷答案失败' }, { status: 500 });
  }
}

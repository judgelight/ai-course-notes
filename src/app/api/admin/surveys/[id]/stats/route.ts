/**
 * AI课程网站问卷功能管理员问卷统计API
 * 用于获取问卷的答题统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/auth';
import { getDb } from '@/lib/db/config';

/**
 * 获取问卷统计数据
 */
export async function GET(
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
      
      // 获取统计数据
      const stats = await db.getSurveyStats(id);
      
      // 获取提交记录
      const submissions = await db.getSurveySubmissions(id, 100, 0);
      
      // 解析问题和答案
      const questions = JSON.parse(survey.questions);
      const parsedSubmissions = submissions.map(sub => ({
        ...sub,
        answers: JSON.parse(sub.answers)
      }));
      
      // 获取问题统计数据
      const questionStatsFromDb = await db.getAllQuestionStats(id);
      
      // 将问题统计数据转换为前端友好格式
      const questionStats = questions.map((q: any) => {
        const questionId = q.id;
        
        // 查找对应的问题统计数据
        const statFromDb = questionStatsFromDb.find(s => s.question_id === questionId);
        
        // 如果找到了统计数据，使用数据库中的统计数据
        if (statFromDb) {
          const optionCounts = JSON.parse(statFromDb.option_counts);
          
          return {
            questionId,
            content: q.content,
            correctOption: q.correct_option,
            optionCounts,
            correctCount: statFromDb.correct_count,
            correctRate: statFromDb.total_answers > 0 
              ? statFromDb.correct_count / statFromDb.total_answers 
              : 0
          };
        } 
        // 如果没有找到统计数据，则从提交记录中计算（兼容旧数据）
        else {
          const optionCounts: Record<string, number> = {};
          let correctCount = 0;
          
          // 初始化选项计数
          q.options.forEach((opt: any) => {
            optionCounts[opt.id] = 0;
          });
          
          // 统计每个选项的选择次数
          parsedSubmissions.forEach(sub => {
            const answer = sub.answers[questionId];
            if (answer) {
              optionCounts[answer] = (optionCounts[answer] || 0) + 1;
              if (answer === q.correct_option) {
                correctCount++;
              }
            }
          });
          
          return {
            questionId,
            content: q.content,
            correctOption: q.correct_option,
            optionCounts,
            correctCount,
            correctRate: submissions.length > 0 ? correctCount / submissions.length : 0
          };
        }
      });
      
      // 转换为前端友好格式
      const result = {
        surveyId: id,
        title: {
          zh: survey.title_zh,
          ja: survey.title_ja
        },
        stats: {
          total: stats.total,
          avgScore: stats.avgScore,
          byLanguage: stats.byLanguage
        },
        questionStats,
        submissions: parsedSubmissions.map(sub => ({
          id: sub.id,
          created_at: sub.created_at,
          language: sub.language,
          score: sub.score,
          answers: sub.answers
        }))
      };
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('获取问卷统计数据失败:', error);
      return NextResponse.json({ error: '获取问卷统计数据失败' }, { status: 500 });
    }
  });
}

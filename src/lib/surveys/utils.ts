/**
 * AI课程网站问卷功能工具函数
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * 问卷JSON格式验证Schema
 */
export const surveySchema = z.object({
  title: z.object({
    zh: z.string().min(1, '中文标题不能为空'),
    ja: z.string().min(1, '日语标题不能为空')
  }),
  description: z.object({
    zh: z.string().optional(),
    ja: z.string().optional()
  }).optional(),
  questions: z.array(
    z.object({
      id: z.string().min(1, '问题ID不能为空'),
      type: z.literal('single_choice'),
      content: z.object({
        zh: z.string().min(1, '中文问题内容不能为空'),
        ja: z.string().min(1, '日语问题内容不能为空')
      }),
      options: z.array(
        z.object({
          id: z.string().min(1, '选项ID不能为空'),
          text: z.object({
            zh: z.string().min(1, '中文选项文本不能为空'),
            ja: z.string().min(1, '日语选项文本不能为空')
          })
        })
      ).min(2, '选项数量至少为2').max(4, '选项数量最多为4'),
      correct_option: z.string().min(1, '正确答案不能为空'),
      explanation: z.object({
        zh: z.string().min(1, '中文解析不能为空'),
        ja: z.string().min(1, '日语解析不能为空')
      })
    })
  ).min(1, '问题列表不能为空')
});

/**
 * 验证问卷JSON格式
 * @param data 问卷数据
 * @returns 验证结果
 */
export function validateSurveyData(data: unknown): { 
  valid: boolean; 
  data?: z.infer<typeof surveySchema>; 
  error?: string 
} {
  try {
    const validData = surveySchema.parse(data);
    
    // 额外验证：检查每个问题的正确答案是否存在于选项中
    for (const question of validData.questions) {
      const optionIds = question.options.map(opt => opt.id);
      if (!optionIds.includes(question.correct_option)) {
        return { 
          valid: false, 
          error: `问题 ${question.id} 的正确答案不在选项列表中` 
        };
      }
    }
    
    return { valid: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => 
        `${e.path.join('.')}：${e.message}`
      ).join('; ');
      return { valid: false, error: errorMessage };
    }
    return { valid: false, error: '问卷数据格式无效' };
  }
}

/**
 * 生成客户端ID
 * 用于标识用户设备，防止重复提交
 * @param request 请求对象
 * @returns 客户端ID
 */
export function generateClientId(request: NextRequest): string {
  // 获取IP地址
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';
  
  // 获取用户代理
  const userAgent = request.headers.get('user-agent') || '';
  
  // 获取Cookie（如果有）
  const cookies = request.cookies.toString();
  
  // 组合并哈希
  const data = `${ip}:${userAgent}:${cookies}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 不再添加随机性，确保同一用户生成相同的ID
  return `${Math.abs(hash)}`;
}

/**
 * 计算答题得分
 * @param surveyQuestions 问卷问题
 * @param answers 用户答案
 * @returns 得分和详细结果
 */
export function calculateScore(
  surveyQuestions: any[], 
  answers: Record<string, string>
): {
  score: number;
  total: number;
  details: Array<{
    questionId: string;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
  }>;
} {
  let correctCount = 0;
  const total = surveyQuestions.length;
  const details = [];

  for (const question of surveyQuestions) {
    const questionId = question.id;
    const userAnswer = answers[questionId] || '';
    const correctAnswer = question.correct_option;
    const correct = userAnswer === correctAnswer;

    if (correct) {
      correctCount++;
    }

    details.push({
      questionId,
      correct,
      userAnswer,
      correctAnswer
    });
  }

  return {
    score: correctCount,
    total,
    details
  };
}

/**
 * 检查本地存储中是否在指定时间内提交过问卷
 * 用于客户端检查
 * @param surveyId 问卷ID
 * @param hours 小时数
 * @returns 是否提交过
 */
export function checkLocalSubmissionHistory(surveyId: string, hours = 1): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const submissions = JSON.parse(localStorage.getItem('surveySubmissions') || '{}');
    const lastSubmission = submissions[surveyId];
    
    if (!lastSubmission) return false;
    
    const timeLimit = Date.now() - hours * 60 * 60 * 1000;
    return lastSubmission > timeLimit;
  } catch (error) {
    console.error('检查提交历史失败:', error);
    return false;
  }
}

/**
 * 记录问卷提交到本地存储
 * @param surveyId 问卷ID
 */
export function recordLocalSubmission(surveyId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const submissions = JSON.parse(localStorage.getItem('surveySubmissions') || '{}');
    submissions[surveyId] = Date.now();
    localStorage.setItem('surveySubmissions', JSON.stringify(submissions));
  } catch (error) {
    console.error('记录提交历史失败:', error);
  }
}

/**
 * 用户问卷详情页面
 * 显示问卷详情并允许用户提交答案
 */

'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SurveyLayout from '@/components/SurveyLayout';
import QuestionRenderer from '@/components/QuestionRenderer';
import { checkLocalSubmissionHistory, recordLocalSubmission } from '@/lib/surveys/utils';

type Lang = 'zh' | 'ja';

interface Question {
  id: string;
  type: 'single_choice';
  content: {
    zh: string;
    ja: string;
  };
  options: Array<{
    id: string;
    text: {
      zh: string;
      ja: string;
    };
  }>;
}

interface Survey {
  id: string;
  title: {
    zh: string;
    ja: string;
  };
  description: {
    zh: string;
    ja: string;
  };
  questions: Question[];
}

interface SubmissionResult {
  success: boolean;
  submissionId: string;
  score: number;
  total: number;
  percentage: number;
  questions: Array<Question & {
    correct_option: string;
    explanation: {
      zh: string;
      ja: string;
    };
    userAnswer: string;
    isCorrect: boolean;
  }>;
}

// 组件参数类型定义
interface SurveyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // 默认使用中文
  const [language, setLanguage] = useState<Lang>('zh');
  
  // 检测浏览器语言（仅在客户端执行）
  useEffect(() => {
    // 从本地存储中获取语言设置
    const storedLang = localStorage.getItem('surveyLanguage') as Lang;
    if (storedLang) {
      setLanguage(storedLang);
      return;
    }
    
    // 检测浏览器语言
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ja')) {
      setLanguage('ja');
    }
  }, []);
  
  // 切换语言
  const handleLanguageChange = (lang: Lang) => {
    setLanguage(lang);
    localStorage.setItem('surveyLanguage', lang);
  };
  
  // 检查是否已提交过
  useEffect(() => {
    const checkSubmission = async () => {
      try {
        // 先检查本地存储
        const localSubmitted = checkLocalSubmissionHistory(id);
        if (localSubmitted) {
          setHasSubmitted(true);
          return;
        }
        
        // 再检查服务器
        const response = await fetch(`/api/surveys/${id}/check-submission`);
        if (!response.ok) {
          throw new Error('检查提交记录失败');
        }
        
        const data = await response.json();
        setHasSubmitted(data.hasSubmitted);
      } catch (error) {
        console.error('检查提交记录失败:', error);
      }
    };
    
    checkSubmission();
  }, [id]);
  
  // 获取问卷详情
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/surveys/${id}`);
        
        if (!response.ok) {
          throw new Error('获取问卷详情失败');
        }
        
        const data = await response.json();
        setSurvey(data);
        setError('');
      } catch (error) {
        console.error('获取问卷详情失败:', error);
        setError(language === 'zh' ? '获取问卷详情失败，请稍后重试' : 'アンケートの詳細の取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSurvey();
  }, [id, language]);
  
  // 选择答案
  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isSubmitting || result) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  // 提交答案
  const handleSubmit = async () => {
    if (!survey || isSubmitting) return;
    
    // 检查是否所有问题都已回答
    const unansweredQuestions = survey.questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      const message = language === 'zh' 
        ? `还有 ${unansweredQuestions.length} 个问题未回答` 
        : `まだ ${unansweredQuestions.length} 問の質問に答えていません`;
      alert(message);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/surveys/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers,
          language
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '提交答案失败');
      }
      
      const data = await response.json();
      setResult(data);
      setHasSubmitted(true);
      
      // 记录到本地存储
      recordLocalSubmission(id);
      
      // 滚动到顶部
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('提交答案失败:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      setError(errorMessage || (language === 'zh' ? '提交答案失败，请稍后重试' : '回答の提出に失敗しました。後でもう一度お試しください。'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 重新做题
  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    window.scrollTo(0, 0);
  };
  
  // 返回问卷列表
  const handleBackToList = () => {
    router.push('/surveys');
  };
  
  // 翻译文本
  const t = (zh: string, ja: string) => {
    return language === 'zh' ? zh : ja;
  };
  
  return (
    <SurveyLayout language={language} onLanguageChange={handleLanguageChange}>
      <div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('加载中...', '読み込み中...')}
            </p>
          </div>
        ) : survey ? (
          <div>
            {/* 问卷标题和描述 */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">
                {survey.title[language]}
              </h1>
              {survey.description && survey.description[language] && (
                <p className="text-gray-600 dark:text-gray-300">
                  {survey.description[language]}
                </p>
              )}
            </div>
            
            {/* 已提交过的提示 */}
            {hasSubmitted && !result && (
              <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-md">
                {t(
                  `您已提交过此问卷。您可以继续作答，但不会被记录。`,
                  `このアンケートを既に提出しています。引き続き回答できますが、記録されません。`
                )}
              </div>
            )}
            
            {/* 结果显示 */}
            {result && (
              <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">
                  {t('答题结果', '回答結果')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('得分', 'スコア')}
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {result.score} / {result.total}
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${
                    result.percentage >= 70 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : result.percentage >= 40 
                        ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                        : 'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('正确率', '正解率')}
                    </div>
                    <div className={`text-2xl font-bold ${
                      result.percentage >= 70 
                        ? 'text-green-600 dark:text-green-400' 
                        : result.percentage >= 40 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      {result.percentage}%
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('评价', '評価')}
                    </div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {result.percentage >= 80 
                        ? t('优秀', '優秀') 
                        : result.percentage >= 60 
                          ? t('良好', '良好') 
                          : result.percentage >= 40 
                            ? t('一般', '普通') 
                            : t('需要加油', '頑張りましょう')}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {t('重新做题', 'もう一度挑戦')}
                  </button>
                  <button
                    onClick={handleBackToList}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    {t('返回列表', 'リストに戻る')}
                  </button>
                </div>
              </div>
            )}
            
            {/* 问题列表 */}
            <div>
              {(result ? result.questions : survey.questions).map((question, index) => (
                <div key={question.id} className="mb-8">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {t('问题', '問題')} {index + 1}
                  </div>
                  <QuestionRenderer
                    question={question}
                    language={language}
                    selectedOption={answers[question.id] || null}
                    onSelectOption={handleSelectOption}
                    showResult={!!result}
                    disabled={!!result}
                  />
                </div>
              ))}
            </div>
            
            {/* 提交按钮 */}
            {!result && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting 
                    ? t('提交中...', '提出中...') 
                    : t('提交答案', '回答を提出')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <p className="text-gray-600 dark:text-gray-400">
              {t('未找到问卷', 'アンケートが見つかりません')}
            </p>
            <button
              onClick={handleBackToList}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t('返回列表', 'リストに戻る')}
            </button>
          </div>
        )}
      </div>
    </SurveyLayout>
  );
}

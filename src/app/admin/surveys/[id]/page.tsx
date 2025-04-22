/**
 * 管理员问卷统计页面
 * 显示问卷的答题统计数据
 */

'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

// 问题类型定义
interface QuestionOption {
  id: string;
  text: {
    zh: string;
    ja: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Question {
  id: string;
  type: 'single_choice';
  content: {
    zh: string;
    ja: string;
  };
  options: Array<QuestionOption>;
  correct_option: string;
  explanation: {
    zh: string;
    ja: string;
  };
}

interface Submission {
  id: string;
  created_at: string;
  language: 'zh' | 'ja';
  score: number;
  answers: Record<string, string>;
}

interface QuestionStat {
  questionId: string;
  content: {
    zh: string;
    ja: string;
  };
  correctOption: string;
  optionCounts: Record<string, number>;
  correctCount: number;
  correctRate: number;
}

interface SurveyStats {
  surveyId: string;
  title: {
    zh: string;
    ja: string;
  };
  stats: {
    total: number;
    avgScore: number;
    byLanguage: Array<{
      language: string;
      count: number;
    }>;
  };
  questionStats: QuestionStat[];
  submissions: Submission[];
}

// 组件参数类型定义
interface SurveyStatsPageProps {
  params: Promise<{ id: string }>;
}

export default function SurveyStatsPage({ params }: SurveyStatsPageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayLanguage, setDisplayLanguage] = useState<'zh' | 'ja'>('zh');
  
  // 获取问卷统计数据和问卷详情
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 获取凭据
        const username = localStorage.getItem('admin_username') || '';
        const password = localStorage.getItem('admin_password') || '';
        const credentials = `${username}:${password}`;
        const base64Credentials = btoa(credentials);
        
        // 获取统计数据
        const statsResponse = await fetch(`/api/admin/surveys/${id}/stats`, {
          headers: {
            'Authorization': `Basic ${base64Credentials}`
          }
        });
        
        if (!statsResponse.ok) {
          throw new Error('获取问卷统计数据失败');
        }
        
        const statsData = await statsResponse.json();
        
        // 获取问卷详情
        const surveyResponse = await fetch(`/api/admin/surveys/${id}`, {
          headers: {
            'Authorization': `Basic ${base64Credentials}`
          }
        });
        
        if (surveyResponse.ok) {
          const surveyData = await surveyResponse.json();
          // 保存问卷数据到本地存储，以便在显示选项文本时使用
          localStorage.setItem(`survey_${id}`, JSON.stringify(surveyData));
        }
        
        setStats(statsData);
        setError('');
      } catch (error) {
        console.error('获取问卷数据失败:', error);
        setError('获取问卷数据失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // 切换显示语言
  const toggleDisplayLanguage = () => {
    setDisplayLanguage(prev => prev === 'zh' ? 'ja' : 'zh');
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 返回问卷列表
  const backToList = () => {
    router.push('/admin/surveys');
  };
  
  // 复制问卷链接
  const copyLink = () => {
    const appUrl = window.location.origin;
    const surveyUrl = `${appUrl}/surveys/${id}`;
    
    navigator.clipboard.writeText(surveyUrl)
      .then(() => {
        alert('问卷链接已复制到剪贴板');
      })
      .catch((error) => {
        console.error('复制链接失败:', error);
        alert('复制链接失败，请手动复制');
      });
  };
  
  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">问卷统计</h1>
          <div className="flex space-x-2">
            <button
              onClick={toggleDisplayLanguage}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {displayLanguage === 'zh' ? '切换到日语' : '切换到中文'}
            </button>
            <button
              onClick={backToList}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              返回列表
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        ) : stats ? (
          <div>
            {/* 问卷基本信息 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {stats.title[displayLanguage]}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">总提交数</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.stats.total}
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">平均得分</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.stats.avgScore.toFixed(1)} / {stats.questionStats.length}
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">平均正确率</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(stats.stats.avgScore / stats.questionStats.length * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">中文：</span>
                    <span className="font-medium">
                      {stats.stats.byLanguage.find(l => l.language === 'zh')?.count || 0}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">日语：</span>
                    <span className="font-medium">
                      {stats.stats.byLanguage.find(l => l.language === 'ja')?.count || 0}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={copyLink}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  复制问卷链接
                </button>
              </div>
            </div>
            
            {/* 问题统计 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">问题统计</h2>
              
              <div className="space-y-6">
                {stats.questionStats.map((question, index) => (
                  <div key={question.questionId} className="border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-md font-medium">
                        问题 {index + 1}: {question.content[displayLanguage]}
                      </h3>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">正确率：</span>
                        <span className={`font-medium ${
                          question.correctRate >= 0.7 
                            ? 'text-green-600 dark:text-green-400' 
                            : question.correctRate >= 0.4 
                              ? 'text-yellow-600 dark:text-yellow-400' 
                              : 'text-red-600 dark:text-red-400'
                        }`}>
                          {(question.correctRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      {stats.submissions.length > 0 && question.optionCounts && (
                        Object.entries(question.optionCounts).map(([optionId, count]) => {
                          // 不需要使用option变量
                          const isCorrect = optionId === question.correctOption;
                          const percentage = stats.stats.total > 0 
                            ? (count / stats.stats.total * 100).toFixed(1) 
                            : '0.0';
                          
                          // 找到对应的选项文本
                          let optionText = `选项 ${optionId}`;
                          
                          // 从API返回的原始问卷数据中查找选项文本
                          try {
                            // 获取问卷数据
                            const survey = JSON.parse(localStorage.getItem(`survey_${id}`) || '{}');
                            if (survey && survey.questions) {
                              const q = survey.questions.find((q: { id: string }) => q.id === question.questionId);
                              if (q) {
                                const opt = q.options.find((o: { id: string }) => o.id === optionId);
                                if (opt && opt.text) {
                                  optionText = opt.text[displayLanguage] || optionText;
                                }
                              }
                            }
                          } catch (error) {
                            console.error('解析选项文本失败:', error);
                          }
                          
                          return (
                            <div key={optionId} className="relative">
                              <div className="flex justify-between mb-1">
                                <div className="text-sm">
                                  {optionId}: {optionText}
                                  {isCorrect && (
                                    <span className="ml-2 text-green-600 dark:text-green-400">
                                      (正确答案)
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm">
                                  {count} ({percentage}%)
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    isCorrect 
                                      ? 'bg-green-600 dark:bg-green-500' 
                                      : 'bg-blue-600 dark:bg-blue-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 提交记录 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">提交记录 ({stats.submissions.length})</h2>
              
              {stats.submissions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">暂无提交记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          提交时间
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          语言
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          得分
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          正确率
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.submissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(submission.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {submission.language === 'zh' ? '中文' : '日语'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {submission.score} / {stats.questionStats.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              submission.score / stats.questionStats.length >= 0.7 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                : submission.score / stats.questionStats.length >= 0.4 
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {(submission.score / stats.questionStats.length * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <p className="text-gray-600 dark:text-gray-400">未找到问卷数据</p>
            <button
              onClick={backToList}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              返回列表
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/**
 * 用户问卷列表页面
 * 显示所有已发布的问卷
 */

'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
// 移除未使用的导入
import SurveyLayout from '@/components/SurveyLayout';

type Lang = 'zh' | 'ja';

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
  created_at: string;
  question_count: number;
}

export default function SurveysPage() {
  // 移除未使用的变量router
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
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
  
  // 获取问卷列表
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/surveys');
        
        if (!response.ok) {
          throw new Error('获取问卷列表失败');
        }
        
        const data = await response.json();
        setSurveys(data);
        setError('');
      } catch (error) {
        console.error('获取问卷列表失败:', error);
        setError(language === 'zh' ? '获取问卷列表失败，请稍后重试' : 'アンケートリストの取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSurveys();
  }, [language]);
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'zh' ? 'zh-CN' : 'ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // 翻译文本
  const t = (zh: string, ja: string) => {
    return language === 'zh' ? zh : ja;
  };
  
  return (
    <SurveyLayout language={language} onLanguageChange={handleLanguageChange}>
      <div>
        <h1 className="text-2xl font-bold mb-6">
          {t('问卷列表', 'アンケート一覧')}
        </h1>
        
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
        ) : surveys.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <p className="text-gray-600 dark:text-gray-400">
              {t('暂无问卷', 'アンケートはありません')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <Link 
                key={survey.id} 
                href={`/surveys/${survey.id}`}
                className="block"
              >
                <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                      {survey.title[language]}
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {survey.description[language]}
                    </p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                      <div>
                        {t('题目数量', '問題数')}: {survey.question_count}
                      </div>
                      <div>
                        {formatDate(survey.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
                    <div className="text-center text-blue-600 dark:text-blue-400 font-medium">
                      {t('开始答题', 'アンケートに答える')} →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SurveyLayout>
  );
}

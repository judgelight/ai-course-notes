/**
 * 管理员问卷列表页面
 * 显示所有问卷，可以查看详情、发布/取消发布和删除问卷
 */

'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

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
  updated_at: string;
  is_published: boolean;
  question_count: number;
}

export default function SurveysPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // 获取问卷列表
  const fetchSurveys = async () => {
    try {
      setIsLoading(true);
      
      // 获取凭据
      const username = localStorage.getItem('admin_username') || '';
      const password = localStorage.getItem('admin_password') || '';
      const credentials = `${username}:${password}`;
      const base64Credentials = btoa(credentials);
      
      const response = await fetch('/api/admin/surveys', {
        headers: {
          'Authorization': `Basic ${base64Credentials}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取问卷列表失败');
      }
      
      const data = await response.json();
      setSurveys(data);
      setError('');
    } catch (error) {
      console.error('获取问卷列表失败:', error);
      setError('获取问卷列表失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchSurveys();
  }, []);

  // 发布/取消发布问卷
  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    try {
      setActionInProgress(id);
      
      // 获取凭据
      const username = localStorage.getItem('admin_username') || '';
      const password = localStorage.getItem('admin_password') || '';
      const credentials = `${username}:${password}`;
      const base64Credentials = btoa(credentials);
      
      const response = await fetch(`/api/admin/surveys/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${base64Credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: !currentStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('更新问卷状态失败');
      }
      
      // 刷新问卷列表
      fetchSurveys();
    } catch (error) {
      console.error('更新问卷状态失败:', error);
      setError('更新问卷状态失败，请稍后重试');
    } finally {
      setActionInProgress(null);
    }
  };

  // 删除问卷
  const deleteSurvey = async (id: string) => {
    // 确认删除
    if (!window.confirm('确定要删除此问卷吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      setActionInProgress(id);
      
      // 获取凭据
      const username = localStorage.getItem('admin_username') || '';
      const password = localStorage.getItem('admin_password') || '';
      const credentials = `${username}:${password}`;
      const base64Credentials = btoa(credentials);
      
      const response = await fetch(`/api/admin/surveys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${base64Credentials}`
        }
      });
      
      if (!response.ok) {
        throw new Error('删除问卷失败');
      }
      
      // 刷新问卷列表
      fetchSurveys();
    } catch (error) {
      console.error('删除问卷失败:', error);
      setError('删除问卷失败，请稍后重试');
    } finally {
      setActionInProgress(null);
    }
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

  // 复制问卷链接
  const copyLink = (id: string) => {
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
          <h1 className="text-2xl font-bold">问卷列表</h1>
          <Link
            href="/admin/surveys/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            上传新问卷
          </Link>
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
        ) : surveys.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <p className="text-gray-600 dark:text-gray-400">暂无问卷</p>
            <Link
              href="/admin/surveys/upload"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              上传新问卷
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    标题
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    题目数
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {surveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {survey.title.zh}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {survey.title.ja}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {survey.question_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(survey.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        survey.is_published 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {survey.is_published ? '已发布' : '未发布'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/admin/surveys/${survey.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          统计
                        </Link>
                        <button
                          onClick={() => togglePublishStatus(survey.id, survey.is_published)}
                          disabled={actionInProgress === survey.id}
                          className={`${
                            survey.is_published 
                              ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300' 
                              : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                          } disabled:opacity-50`}
                        >
                          {actionInProgress === survey.id 
                            ? '处理中...' 
                            : (survey.is_published ? '取消发布' : '发布')}
                        </button>
                        {survey.is_published && (
                          <button
                            onClick={() => copyLink(survey.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            复制链接
                          </button>
                        )}
                        <button
                          onClick={() => deleteSurvey(survey.id)}
                          disabled={actionInProgress === survey.id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

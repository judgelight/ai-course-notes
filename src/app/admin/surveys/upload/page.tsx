/**
 * 管理员问卷上传页面
 * 用于上传JSON格式的问卷
 */

'use client'

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import QuestionRenderer from '@/components/QuestionRenderer';

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
  correct_option: string;
  explanation: {
    zh: string;
    ja: string;
  };
}

interface SurveyData {
  title: {
    zh: string;
    ja: string;
  };
  description?: {
    zh: string;
    ja: string;
  };
  questions: Question[];
}

export default function UploadSurveyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonContent, setJsonContent] = useState('');
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<'zh' | 'ja'>('zh');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [surveyId, setSurveyId] = useState('');
  const [surveyUrl, setSurveyUrl] = useState('');

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('请上传JSON格式的文件');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonContent(content);
        
        // 解析JSON
        const data = JSON.parse(content);
        validateAndSetSurveyData(data);
      } catch (error) {
        console.error('解析JSON失败:', error);
        setError('解析JSON失败，请检查文件格式');
        setSurveyData(null);
      }
    };
    reader.onerror = () => {
      setError('读取文件失败');
    };
    reader.readAsText(file);
  };

  // 处理JSON输入
  const handleJsonInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setJsonContent(content);
    
    try {
      if (!content.trim()) {
        setSurveyData(null);
        setError('');
        return;
      }
      
      // 解析JSON
      const data = JSON.parse(content);
      validateAndSetSurveyData(data);
    } catch (error) {
      console.error('解析JSON失败:', error);
      setError('解析JSON失败，请检查格式');
      setSurveyData(null);
    }
  };

  // 验证并设置问卷数据
  const validateAndSetSurveyData = (data: any) => {
    // 基本结构验证
    if (!data.title || !data.title.zh || !data.title.ja) {
      setError('问卷标题缺失或格式不正确');
      setSurveyData(null);
      return;
    }
    
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      setError('问题列表缺失或为空');
      setSurveyData(null);
      return;
    }
    
    // 验证每个问题
    for (const question of data.questions) {
      // 检查问题ID
      if (!question.id) {
        setError('问题缺少ID');
        setSurveyData(null);
        return;
      }
      
      // 检查问题类型
      if (question.type !== 'single_choice') {
        setError(`问题 ${question.id} 类型不支持`);
        setSurveyData(null);
        return;
      }
      
      // 检查问题内容
      if (!question.content || !question.content.zh || !question.content.ja) {
        setError(`问题 ${question.id} 内容缺失或格式不正确`);
        setSurveyData(null);
        return;
      }
      
      // 检查选项
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 4) {
        setError(`问题 ${question.id} 选项数量不正确（应为2-4个）`);
        setSurveyData(null);
        return;
      }
      
      // 检查每个选项
      for (const option of question.options) {
        if (!option.id || !option.text || !option.text.zh || !option.text.ja) {
          setError(`问题 ${question.id} 的选项格式不正确`);
          setSurveyData(null);
          return;
        }
      }
      
      // 检查正确答案
      if (!question.correct_option) {
        setError(`问题 ${question.id} 缺少正确答案`);
        setSurveyData(null);
        return;
      }
      
      // 检查正确答案是否存在于选项中
      const optionIds = question.options.map((opt: any) => opt.id);
      if (!optionIds.includes(question.correct_option)) {
        setError(`问题 ${question.id} 的正确答案不在选项列表中`);
        setSurveyData(null);
        return;
      }
      
      // 检查解析
      if (!question.explanation || !question.explanation.zh || !question.explanation.ja) {
        setError(`问题 ${question.id} 缺少解析`);
        setSurveyData(null);
        return;
      }
    }
    
    // 验证通过
    setSurveyData(data);
    setError('');
  };

  // 上传问卷
  const handleUpload = async () => {
    if (!surveyData) {
      setError('请先上传或输入有效的问卷数据');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // 获取凭据
      const username = localStorage.getItem('admin_username') || '';
      const password = localStorage.getItem('admin_password') || '';
      const credentials = `${username}:${password}`;
      const base64Credentials = btoa(credentials);
      
      const response = await fetch('/api/admin/surveys', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${base64Credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(surveyData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传问卷失败');
      }
      
      const data = await response.json();
      
      // 上传成功
      setUploadSuccess(true);
      setSurveyId(data.id);
      setSurveyUrl(data.url);
      setError('');
      
      // 清空表单
      setJsonContent('');
      setSurveyData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('上传问卷失败:', error);
      setError(error.message || '上传问卷失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 切换预览语言
  const togglePreviewLanguage = () => {
    setPreviewLanguage(prev => prev === 'zh' ? 'ja' : 'zh');
  };

  // 复制问卷链接
  const copyLink = () => {
    navigator.clipboard.writeText(surveyUrl)
      .then(() => {
        alert('问卷链接已复制到剪贴板');
      })
      .catch((error) => {
        console.error('复制链接失败:', error);
        alert('复制链接失败，请手动复制');
      });
  };

  // 查看问卷统计
  const viewStats = () => {
    router.push(`/admin/surveys/${surveyId}`);
  };

  // 返回问卷列表
  const backToList = () => {
    router.push('/admin/surveys');
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">上传问卷</h1>
        
        {uploadSuccess ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="mb-4 p-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md">
              问卷上传成功！
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">问卷ID：{surveyId}</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">问卷链接：</p>
              <div className="flex items-center">
                <input
                  type="text"
                  value={surveyUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700"
                />
                <button
                  onClick={copyLink}
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  复制
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={viewStats}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                查看统计
              </button>
              <button
                onClick={backToList}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                返回列表
              </button>
              <button
                onClick={() => {
                  setUploadSuccess(false);
                  setSurveyId('');
                  setSurveyUrl('');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                上传新问卷
              </button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">上传JSON文件</h2>
              
              <div className="mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                />
              </div>
              
              <h2 className="text-lg font-semibold mb-4">或直接输入JSON</h2>
              
              <div className="mb-4">
                <textarea
                  value={jsonContent}
                  onChange={handleJsonInput}
                  placeholder="在此输入JSON格式的问卷数据..."
                  className="w-full h-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
              </div>
              
              <button
                onClick={handleUpload}
                disabled={!surveyData || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? '上传中...' : '上传问卷'}
              </button>
            </div>
            
            {surveyData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">问卷预览</h2>
                  <button
                    onClick={togglePreviewLanguage}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {previewLanguage === 'zh' ? '切换到日语' : '切换到中文'}
                  </button>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">
                    {surveyData.title[previewLanguage]}
                  </h3>
                  {surveyData.description && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {surveyData.description[previewLanguage]}
                    </p>
                  )}
                </div>
                
                <div>
                  {surveyData.questions.map((question, index) => (
                    <div key={question.id} className="mb-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        问题 {index + 1}
                      </div>
                      <QuestionRenderer
                        question={question}
                        language={previewLanguage}
                        selectedOption={question.correct_option}
                        onSelectOption={() => {}}
                        showResult={true}
                        disabled={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

/**
 * 管理员布局组件
 * 用于管理员页面的布局
 */

'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializingDb, setIsInitializingDb] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  // 初始化数据库
  const initializeDatabase = async () => {
    if (dbInitialized || isInitializingDb) return;
    
    try {
      setIsInitializingDb(true);
      
      const credentials = `${localStorage.getItem('admin_username') || ''}:${localStorage.getItem('admin_password') || ''}`;
      const base64Credentials = btoa(credentials);
      
      const response = await fetch('/api/admin/init-db', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${base64Credentials}`
        }
      });
      
      if (response.ok) {
        setDbInitialized(true);
        console.log('数据库初始化成功');
      } else {
        console.error('数据库初始化失败');
      }
    } catch (error) {
      console.error('数据库初始化请求失败:', error);
    } finally {
      setIsInitializingDb(false);
    }
  };

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const credentials = `${username || localStorage.getItem('admin_username') || ''}:${password || localStorage.getItem('admin_password') || ''}`;
        const base64Credentials = btoa(credentials);
        
        const response = await fetch('/api/admin/auth', {
          headers: {
            'Authorization': `Basic ${base64Credentials}`
          }
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
          if (username && password) {
            localStorage.setItem('admin_username', username);
            localStorage.setItem('admin_password', password);
          }
          
          // 登录成功后初始化数据库
          initializeDatabase();
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('admin_username');
          localStorage.removeItem('admin_password');
        }
      } catch (error) {
        console.error('认证检查失败:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [username, password]);

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    
    try {
      setIsLoading(true);
      const credentials = `${username}:${password}`;
      const base64Credentials = btoa(credentials);
      
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${base64Credentials}`
        }
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_username', username);
        localStorage.setItem('admin_password', password);
        setError('');
      } else {
        setError('用户名或密码错误');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('登录失败:', error);
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_password');
    setUsername('');
    setPassword('');
    setIsAuthenticated(false);
  };

  // 登录成功后自动初始化数据库
  useEffect(() => {
    if (isAuthenticated === true) {
      initializeDatabase();
    }
  }, [isAuthenticated]);

  // 登录页面
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">管理员登录</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                用户名
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                密码
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 加载中或初始化数据库中
  if (isLoading || isAuthenticated === null || isInitializingDb) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {isInitializingDb ? '正在初始化数据库...' : '加载中...'}
          </p>
        </div>
      </div>
    );
  }

  // 管理员布局
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="text-xl font-bold text-blue-600">
                  问卷管理系统
                </Link>
              </div>
              <nav className="ml-6 flex space-x-4 items-center">
                <Link 
                  href="/admin/surveys" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname.startsWith('/admin/surveys') 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  问卷列表
                </Link>
                <Link 
                  href="/admin/surveys/upload" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/admin/surveys/upload' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  上传问卷
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} AI课程网站 - 问卷管理系统
          </p>
        </div>
      </footer>
    </div>
  );
}

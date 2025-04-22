/**
 * 管理员首页
 * 重定向到问卷列表页面
 */

'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function AdminPage() {
  const router = useRouter();
  
  // 重定向到问卷列表页面
  useEffect(() => {
    router.push('/admin/surveys');
  }, [router]);
  
  return (
    <AdminLayout>
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">正在跳转到问卷列表...</p>
      </div>
    </AdminLayout>
  );
}

/**
 * 数据库初始化API
 * 用于初始化数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/auth';
import { initDatabase } from '@/lib/db/config';

/**
 * 初始化数据库
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return adminAuthMiddleware(request, async () => {
    try {
      await initDatabase();
      return NextResponse.json({ 
        success: true, 
        message: '数据库初始化成功' 
      });
    } catch (error) {
      console.error('数据库初始化失败:', error);
      return NextResponse.json({ 
        error: '数据库初始化失败' 
      }, { status: 500 });
    }
  });
}

/**
 * AI课程网站问卷功能管理员认证API
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/auth';

/**
 * 验证管理员登录状态
 * 用于客户端检查登录状态
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return adminAuthMiddleware(request, async () => {
    return NextResponse.json({ authenticated: true });
  });
}

/**
 * 管理员登录处理
 * 仅用于验证凭据，不创建会话
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return adminAuthMiddleware(request, async () => {
    return NextResponse.json({ success: true, message: '登录成功' });
  });
}

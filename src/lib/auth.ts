/**
 * AI课程网站问卷功能认证工具
 * 实现Basic Authentication认证
 */

import { NextRequest, NextResponse } from 'next/server';

// 管理员认证配置
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

/**
 * 验证Basic Authentication凭据
 * @param authHeader Authorization头部值
 * @returns 是否验证通过
 */
export function verifyCredentials(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    // 解码Base64凭据
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // 验证用户名和密码
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  } catch (error) {
    console.error('认证解析错误:', error);
    return false;
  }
}

/**
 * 管理员认证中间件
 * 用于保护管理员API路由
 * @param request 请求对象
 * @param handler 处理函数
 * @returns 响应对象
 */
export async function adminAuthMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // 获取Authorization头部
  const authHeader = request.headers.get('Authorization');

  // 验证凭据
  if (!verifyCredentials(authHeader)) {
    // 认证失败，返回401响应
    return new NextResponse(JSON.stringify({ error: '未授权访问' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="管理员区域"'
      }
    });
  }

  // 认证成功，继续处理请求
  return handler(request);
}

/**
 * 检查是否已登录
 * 用于客户端检查登录状态
 * @param request 请求对象
 * @returns 是否已登录
 */
export function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  return verifyCredentials(authHeader);
}

/**
 * AI课程网站问卷功能数据库配置
 * 根据环境变量配置SQLite或Turso数据库
 */

import path from 'path';
import { DbUtils, DbType } from './utils';
import fs from 'fs';

// 数据库配置
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const SQLITE_FILE = process.env.SQLITE_FILE || path.join(process.cwd(), 'data', 'surveys.db');
const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

// 确保SQLite数据库目录存在
if (DB_TYPE === 'sqlite') {
  const dbDir = path.dirname(SQLITE_FILE);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

/**
 * 创建数据库工具实例
 * @returns 数据库工具实例
 */
export function createDbUtils(): DbUtils {
  if (DB_TYPE === 'turso' && (!TURSO_URL || !TURSO_TOKEN)) {
    console.warn('Turso数据库URL或令牌未设置，将使用SQLite作为备选');
    return new DbUtils({
      type: 'sqlite',
      sqliteFile: SQLITE_FILE
    });
  }

  return new DbUtils({
    type: DB_TYPE as DbType,
    sqliteFile: SQLITE_FILE,
    tursoUrl: TURSO_URL,
    tursoToken: TURSO_TOKEN
  });
}

/**
 * 初始化数据库
 * @returns Promise<void>
 */
export async function initDatabase(): Promise<void> {
  const db = createDbUtils();
  
  try {
    // 读取SQL初始化脚本
    const sqlScript = fs.readFileSync(
      path.join(process.cwd(), 'src', 'lib', 'db', 'init.sql'),
      'utf-8'
    );
    
    // 初始化数据库
    await db.initDb(sqlScript);
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    db.close();
  }
}

// 单例模式获取数据库实例
let dbInstance: DbUtils | null = null;

/**
 * 获取数据库实例（单例模式）
 * @returns 数据库工具实例
 */
export function getDb(): DbUtils {
  if (!dbInstance) {
    dbInstance = createDbUtils();
  }
  return dbInstance;
}

/**
 * 关闭数据库连接
 */
export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

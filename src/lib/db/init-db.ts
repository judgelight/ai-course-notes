/**
 * AI课程网站问卷功能数据库初始化脚本
 * 用于在应用启动时初始化数据库
 */

// src/lib/db/init-db.ts
import { initDatabase } from './config';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

export async function initDb(): Promise<void> {
  try {
    console.log('正在初始化数据库...');
    await initDatabase();
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// === 以下替换 require.main === module ===

const thisFile = fileURLToPath(import.meta.url);
const runFile  = fileURLToPath(pathToFileURL(process.argv[1]).href);

if (thisFile === runFile) {
  // 直接用 top-level await 也可以，这里用 IIFE 保持兼容
  (async () => {
    try {
      await initDb();
      console.log('数据库初始化脚本执行完成');
      process.exit(0);
    } catch {
      console.error('数据库初始化脚本执行失败');
      process.exit(1);
    }
  })();
}

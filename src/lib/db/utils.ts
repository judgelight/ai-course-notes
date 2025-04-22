/**
 * AI课程网站问卷功能数据库工具类
 * 支持SQLite和Turso数据库
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { Database } from 'better-sqlite3';
import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';

// 数据库类型
export type DbType = 'sqlite' | 'turso';

// 问卷类型
export interface Survey {
  id: string;
  title_zh: string;
  title_ja: string;
  description_zh?: string;
  description_ja?: string;
  questions: string; // JSON字符串
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

// 答题记录类型
export interface Submission {
  id: string;
  survey_id: string;
  answers: string; // JSON字符串
  score: number;
  created_at: string;
  language: 'zh' | 'ja';
  client_id: string;
}

// 问题统计类型
export interface QuestionStat {
  id: string;
  survey_id: string;
  question_id: string;
  total_answers: number;
  correct_count: number;
  option_counts: string; // JSON字符串，格式为 { "option_id": count }
  updated_at: string;
}

// 数据库配置
export interface DbConfig {
  type: DbType;
  sqliteFile?: string; // SQLite文件路径
  tursoUrl?: string;   // Turso数据库URL
  tursoToken?: string; // Turso认证令牌
}

/**
 * 数据库工具类
 */
export class DbUtils {
  private db: Database | ReturnType<typeof createClient>;
  private type: DbType;

  /**
   * 构造函数
   * @param config 数据库配置
   */
  constructor(config: DbConfig) {
    this.type = config.type;

    if (this.type === 'sqlite') {
      if (!config.sqliteFile) {
        throw new Error('SQLite文件路径未指定');
      }
      // 导入better-sqlite3需要在运行时进行，因为它是一个原生模块
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const sqlite3 = require('better-sqlite3');
      this.db = new sqlite3(config.sqliteFile);
    } else if (this.type === 'turso') {
      if (!config.tursoUrl || !config.tursoToken) {
        throw new Error('Turso数据库URL或认证令牌未指定');
      }
      this.db = createClient({
        url: config.tursoUrl,
        authToken: config.tursoToken,
      });
    } else {
      throw new Error('不支持的数据库类型');
    }
  }

  /**
   * 初始化数据库
   * @param sqlScript SQL脚本内容
   */
  async initDb(sqlScript: string): Promise<void> {
    const statements = sqlScript.split(';').filter(stmt => stmt.trim());

    if (this.type === 'sqlite') {
      // SQLite可以直接执行多条语句
      (this.db as Database).exec(sqlScript);
    } else {
      // Turso需要逐条执行
      for (const stmt of statements) {
        if (stmt.trim()) {
          await (this.db as ReturnType<typeof createClient>).execute(stmt + ';');
        }
      }
    }
  }

  /**
   * 创建问卷
   * @param survey 问卷数据（不包含id、created_at和updated_at）
   * @returns 创建的问卷ID
   */
  async createSurvey(survey: Omit<Survey, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO surveys (
        id, title_zh, title_ja, description_zh, description_ja, 
        questions, created_at, updated_at, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      survey.title_zh,
      survey.title_ja,
      survey.description_zh || '',
      survey.description_ja || '',
      survey.questions,
      now,
      now,
      survey.is_published ? 1 : 0
    ];

    if (this.type === 'sqlite') {
      (this.db as Database).prepare(sql).run(...params);
    } else {
      await (this.db as ReturnType<typeof createClient>).execute({ sql, args: params });
    }

    return id;
  }

  /**
   * 获取问卷列表
   * @param publishedOnly 是否只获取已发布的问卷
   * @returns 问卷列表
   */
  async getSurveys(publishedOnly = false): Promise<Survey[]> {
    let sql = 'SELECT * FROM surveys';
    if (publishedOnly) {
      sql += ' WHERE is_published = 1';
    }
    sql += ' ORDER BY created_at DESC';

    let result;
    if (this.type === 'sqlite') {
      result = (this.db as Database).prepare(sql).all();
    } else {
      const { rows } = await (this.db as ReturnType<typeof createClient>).execute(sql);
      result = rows;
    }

    return (result as any[]).map(row => ({
      ...row,
      is_published: Boolean(row.is_published)
    })) as Survey[];
  }

  /**
   * 获取问卷详情
   * @param id 问卷ID
   * @returns 问卷详情
   */
  async getSurvey(id: string): Promise<Survey | null> {
    const sql = 'SELECT * FROM surveys WHERE id = ?';
    
    let result;
    if (this.type === 'sqlite') {
      result = (this.db as Database).prepare(sql).get(id);
    } else {
      const { rows } = await (this.db as ReturnType<typeof createClient>).execute({ sql, args: [id] });
      result = rows[0];
    }

    if (!result) return null;

    return {
      ...result,
      is_published: Boolean((result as any).is_published)
    } as Survey;
  }

  /**
   * 更新问卷
   * @param id 问卷ID
   * @param survey 问卷数据
   */
  async updateSurvey(id: string, survey: Partial<Omit<Survey, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const updates: string[] = [];
    const params: unknown[] = [];

    // 构建更新字段
    Object.entries(survey).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        updates.push(`${key} = ?`);
        params.push(key === 'is_published' ? (value ? 1 : 0) : value);
      }
    });

    if (updates.length === 0) return;

    // 添加更新时间
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());

    // 添加ID
    params.push(id);

    const sql = `UPDATE surveys SET ${updates.join(', ')} WHERE id = ?`;

    if (this.type === 'sqlite') {
      (this.db as Database).prepare(sql).run(...params);
    } else {
      await (this.db as ReturnType<typeof createClient>).execute({ 
        sql, 
        args: params as any[] 
      });
    }
  }

  /**
   * 删除问卷
   * @param id 问卷ID
   */
  async deleteSurvey(id: string): Promise<void> {
    const sql = 'DELETE FROM surveys WHERE id = ?';

    if (this.type === 'sqlite') {
      (this.db as Database).prepare(sql).run(id);
    } else {
      await (this.db as ReturnType<typeof createClient>).execute({ sql, args: [id] });
    }
  }

  /**
   * 创建答题记录
   * @param submission 答题记录（不包含id和created_at）
   * @param updateStats 是否更新问题统计
   * @returns 创建的答题记录ID
   */
  async createSubmission(
    submission: Omit<Submission, 'id' | 'created_at'>, 
    updateStats: boolean = true
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO submissions (
        id, survey_id, answers, score, created_at, language, client_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      submission.survey_id,
      submission.answers,
      submission.score,
      now,
      submission.language,
      submission.client_id
    ];

    if (this.type === 'sqlite') {
      (this.db as Database).prepare(sql).run(...params);
    } else {
      await (this.db as ReturnType<typeof createClient>).execute({ sql, args: params });
    }

    // 更新问题统计
    if (updateStats) {
      try {
        // 解析答案
        const answers = JSON.parse(submission.answers);
        
        // 获取问卷
        const survey = await this.getSurvey(submission.survey_id);
        if (survey) {
          // 解析问题
          const questions = JSON.parse(survey.questions);
          
          // 更新每个问题的统计
          for (const question of questions) {
            const questionId = question.id;
            const answer = answers[questionId];
            
            if (answer) {
              await this.updateQuestionStat(
                submission.survey_id,
                questionId,
                answer,
                question.correct_option === answer
              );
            }
          }
        }
      } catch (error) {
        console.error('更新问题统计失败:', error);
        // 不影响提交记录的创建，所以不抛出异常
      }
    }

    return id;
  }

  /**
   * 检查用户是否在指定时间内提交过问卷
   * @param survey_id 问卷ID
   * @param client_id 客户端ID
   * @param hours 小时数
   * @returns 是否提交过
   */
  async checkRecentSubmission(survey_id: string, client_id: string, hours = 1): Promise<boolean> {
    // 计算时间阈值
    const now = new Date();
    const timeAgo = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
    
    let sql: string;
    if (this.type === 'sqlite') {
      sql = `
        SELECT COUNT(*) as count FROM submissions 
        WHERE survey_id = ? AND client_id = ? AND created_at > ?
      `;
    } else {
      // Turso使用不同的日期时间函数
      sql = `
        SELECT COUNT(*) as count FROM submissions 
        WHERE survey_id = ? AND client_id = ? AND created_at > ?
      `;
    }
    
    let result;
    if (this.type === 'sqlite') {
      result = (this.db as Database).prepare(sql).get(survey_id, client_id, timeAgo);
    } else {
      const { rows } = await (this.db as ReturnType<typeof createClient>).execute({ 
        sql, 
        args: [survey_id, client_id, timeAgo] 
      });
      result = rows[0];
    }

    return (result as any).count > 0;
  }

  /**
   * 检查用户是否曾经提交过问卷（不限时间）
   * @param survey_id 问卷ID
   * @param client_id 客户端ID
   * @returns 是否提交过
   */
  async hasSubmittedSurvey(survey_id: string, client_id: string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count FROM submissions 
      WHERE survey_id = ? AND client_id = ?
    `;
    
    let result;
    if (this.type === 'sqlite') {
      result = (this.db as Database).prepare(sql).get(survey_id, client_id);
    } else {
      const { rows } = await (this.db as ReturnType<typeof createClient>).execute({ 
        sql, 
        args: [survey_id, client_id] 
      });
      result = rows[0];
    }

    return (result as any).count > 0;
  }

  /**
   * 获取问卷的答题统计
   * @param survey_id 问卷ID
   * @returns 统计数据
   */
  async getSurveyStats(survey_id: string): Promise<{
    total: number;
    avgScore: number;
    byLanguage: { language: string; count: number }[];
  }> {
    // 总提交数和平均分
    const totalSql = `
      SELECT COUNT(*) as total, AVG(score) as avgScore 
      FROM submissions WHERE survey_id = ?
    `;
    
    // 按语言统计
    const langSql = `
      SELECT language, COUNT(*) as count 
      FROM submissions WHERE survey_id = ? 
      GROUP BY language
    `;

    let totalResult, langResult;
    
    if (this.type === 'sqlite') {
      totalResult = (this.db as Database).prepare(totalSql).get(survey_id);
      langResult = (this.db as Database).prepare(langSql).all(survey_id);
    } else {
      const totalRes = await (this.db as ReturnType<typeof createClient>).execute({ 
        sql: totalSql, 
        args: [survey_id] 
      });
      totalResult = totalRes.rows[0];
      
      const langRes = await (this.db as ReturnType<typeof createClient>).execute({ 
        sql: langSql, 
        args: [survey_id] 
      });
      langResult = langRes.rows;
    }

    return {
      total: (totalResult as any).total || 0,
      avgScore: (totalResult as any).avgScore || 0,
      byLanguage: (langResult as any[]).map(row => ({
        language: row.language as string,
        count: row.count as number
      })) || []
    };
  }

  /**
   * 获取问题统计
   * @param survey_id 问卷ID
   * @param question_id 问题ID
   * @returns 问题统计数据
   */
  async getQuestionStat(survey_id: string, question_id: string): Promise<QuestionStat | null> {
    const sql = `
      SELECT * FROM question_stats 
      WHERE survey_id = ? AND question_id = ?
    `;
    
    let result;
    if (this.type === 'sqlite') {
      result = (this.db as Database).prepare(sql).get(survey_id, question_id);
    } else {
      const { rows } = await (this.db as ReturnType<typeof createClient>).execute({ 
        sql, 
        args: [survey_id, question_id] 
      });
      result = rows[0];
    }

    return result ? result as QuestionStat : null;
  }

  /**
   * 获取问卷的所有问题统计
   * @param survey_id 问卷ID
   * @returns 问题统计数据列表
   */
  async getAllQuestionStats(survey_id: string): Promise<QuestionStat[]> {
    const sql = `
      SELECT * FROM question_stats 
      WHERE survey_id = ?
    `;
    
    let result;
    if (this.type === 'sqlite') {
      result = (this.db as Database).prepare(sql).all(survey_id);
    } else {
      const { rows } = await (this.db as ReturnType<typeof createClient>).execute({ 
        sql, 
        args: [survey_id] 
      });
      result = rows;
    }

    return result as QuestionStat[];
  }

  /**
   * 更新问题统计
   * @param survey_id 问卷ID
   * @param question_id 问题ID
   * @param answer_option_id 回答的选项ID
   * @param is_correct 是否正确
   */
  async updateQuestionStat(
    survey_id: string, 
    question_id: string, 
    answer_option_id: string, 
    is_correct: boolean
  ): Promise<void> {
    // 先查询是否存在
    const stat = await this.getQuestionStat(survey_id, question_id);
    const now = new Date().toISOString();
    
    if (stat) {
      // 已存在，更新
      let optionCounts: Record<string, number>;
      try {
        optionCounts = JSON.parse(stat.option_counts);
      } catch (error) {
        optionCounts = {};
      }
      
      // 更新选项计数
      optionCounts[answer_option_id] = (optionCounts[answer_option_id] || 0) + 1;
      
      const sql = `
        UPDATE question_stats 
        SET total_answers = total_answers + 1, 
            correct_count = correct_count + ?, 
            option_counts = ?, 
            updated_at = ? 
        WHERE id = ?
      `;
      
      const params = [
        is_correct ? 1 : 0,
        JSON.stringify(optionCounts),
        now,
        stat.id
      ];
      
      if (this.type === 'sqlite') {
        (this.db as Database).prepare(sql).run(...params);
      } else {
        await (this.db as ReturnType<typeof createClient>).execute({ 
          sql, 
          args: params as any[] 
        });
      }
    } else {
      // 不存在，创建
      const id = uuidv4();
      const optionCounts: Record<string, number> = {};
      optionCounts[answer_option_id] = 1;
      
      const sql = `
        INSERT INTO question_stats (
          id, survey_id, question_id, total_answers, correct_count, option_counts, updated_at
        ) VALUES (?, ?, ?, 1, ?, ?, ?)
      `;
      
      const params = [
        id,
        survey_id,
        question_id,
        is_correct ? 1 : 0,
        JSON.stringify(optionCounts),
        now
      ];
      
      if (this.type === 'sqlite') {
        (this.db as Database).prepare(sql).run(...params);
      } else {
        await (this.db as ReturnType<typeof createClient>).execute({ 
          sql, 
          args: params as any[] 
        });
      }
    }
  }

  /**
   * 获取问卷的答题详情
   * @param survey_id 问卷ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns 答题详情列表
   */
  async getSurveySubmissions(survey_id: string, limit = 100, offset = 0): Promise<Submission[]> {
    const sql = `
      SELECT * FROM submissions 
      WHERE survey_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    let result;
    if (this.type === 'sqlite') {
      result = (this.db as Database).prepare(sql).all(survey_id, limit, offset);
    } else {
      const { rows } = await (this.db as ReturnType<typeof createClient>).execute({ 
        sql, 
        args: [survey_id, limit, offset] 
      });
      result = rows;
    }

    return result as Submission[];
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.type === 'sqlite' && this.db) {
      (this.db as Database).close();
    }
    // Turso客户端不需要显式关闭
  }
}

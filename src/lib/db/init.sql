-- AI课程网站问卷功能数据库初始化脚本
-- 适用于SQLite和Turso数据库

-- 问卷表
CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    title_zh TEXT NOT NULL,
    title_ja TEXT NOT NULL,
    description_zh TEXT,
    description_ja TEXT,
    questions TEXT NOT NULL,  -- JSON格式存储问题数据
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN NOT NULL DEFAULT 0
);

-- 答题记录表
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL,
    answers TEXT NOT NULL,  -- JSON格式存储答案数据
    score INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    language TEXT NOT NULL,  -- 'zh'或'ja'
    client_id TEXT NOT NULL,  -- 设备标识
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

-- 问题统计表
CREATE TABLE IF NOT EXISTS question_stats (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    total_answers INTEGER NOT NULL DEFAULT 0,  -- 总答题次数
    correct_count INTEGER NOT NULL DEFAULT 0,  -- 正确次数
    option_counts TEXT NOT NULL,  -- JSON格式存储每个选项的选择次数
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    UNIQUE(survey_id, question_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submissions_survey_id ON submissions(survey_id);
CREATE INDEX IF NOT EXISTS idx_submissions_client_id ON submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- 创建用于检查重复提交的索引
CREATE INDEX IF NOT EXISTS idx_submissions_survey_client ON submissions(survey_id, client_id);

-- 创建问题统计索引
CREATE INDEX IF NOT EXISTS idx_question_stats_survey_id ON question_stats(survey_id);
CREATE INDEX IF NOT EXISTS idx_question_stats_question_id ON question_stats(question_id);

-- 创建用于统计的索引
CREATE INDEX IF NOT EXISTS idx_surveys_is_published ON surveys(is_published);

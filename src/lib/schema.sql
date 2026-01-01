-- 启用外键约束
PRAGMA foreign_keys = ON;

-- 学生表
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY, -- 考号
    report_id TEXT, -- 报到号
    name TEXT NOT NULL,
    gender INTEGER, -- 1: 男, 2: 女
    class TEXT,
    class_order INTEGER,
    student_status INTEGER,
    password TEXT -- 明文存储
);

-- 考试表
CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    date TEXT,
    type TEXT -- 月考/期中/期末
);

-- 考试结果主表
CREATE TABLE IF NOT EXISTS exam_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    student_id TEXT NOT NULL,
    total_score REAL,
    grade_rank INTEGER,
    class_rank INTEGER,
    elective_rank INTEGER,
    other_total_score REAL,
    other_total_grade_rank INTEGER,
    other_total_class_rank INTEGER,
    missing_count INTEGER DEFAULT 0,
    remarks TEXT,
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE(exam_id, student_id)
);

-- 科目成绩表
CREATE TABLE IF NOT EXISTS subject_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    score REAL,
    grade_rank INTEGER,
    class_rank INTEGER,
    arts_science_rank INTEGER,
    scaled_score REAL, -- 赋分
    FOREIGN KEY (result_id) REFERENCES exam_results(id),
    UNIQUE(result_id, subject)
);

-- AI 诊断缓存表
CREATE TABLE IF NOT EXISTS ai_diagnoses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    exam_id INTEGER NOT NULL,
    intent TEXT NOT NULL, -- 'OVERVIEW', 'SUBJECT_DEEP_DIVE', 'STRATEGY'
    model TEXT,
    result TEXT NOT NULL, -- JSON string or Image URL
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    UNIQUE(student_id, exam_id, intent, model)
);

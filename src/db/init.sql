CREATE DATABASE IF NOT EXISTS node_express CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE node_express;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email)
);

-- ===========================================================================
-- 学生表 (students)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  name VARCHAR(100) NOT NULL COMMENT '姓名',
  age TINYINT UNSIGNED DEFAULT NULL COMMENT '年龄',
  gender ENUM('male', 'female', 'other') DEFAULT 'other' COMMENT '性别',
  grade VARCHAR(50) DEFAULT NULL COMMENT '年级/班级',
  email VARCHAR(191) DEFAULT NULL COMMENT '邮箱',
  mobile VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_students_email (email)
) COMMENT '学生信息表';

-- 插入一些示例数据供开发测试
INSERT INTO students (name, age, gender, grade, email, mobile) VALUES
  ('张三', 20, 'male', '2024级计算机科学1班', 'zhangsan@example.com', '13800001001'),
  ('李四', 21, 'female', '2024级软件工程2班', 'lisi@example.com', '13800001002'),
  ('王五', 19, 'male', '2025级数据科学1班', 'wangwu@example.com', '13800001003'),
  ('赵六', 22, 'female', '2023级人工智能1班', 'zhaoliu@example.com', '13800001004'),
  ('孙七', 20, 'male', '2024级计算机科学2班', 'sunqi@example.com', '13800001005')
ON DUPLICATE KEY UPDATE name = VALUES(name);

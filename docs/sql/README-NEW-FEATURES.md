# 新增功能数据库表说明

## 概述

本文档说明智慧教育学习平台新增的8张数据库表，用于支持需求16-20的新功能实现。

## 新增表列表

### 1. learning_analytics_reports (学情报告表)

**需求**：16.1 - 智能学情分析与可视化报告

**功能**：存储AI生成的学情分析报告，包含统计数据、趋势分析、薄弱点分布等。

**关键字段**：
- `user_id`: 用户ID（学生或班级）
- `user_type`: 用户类型（student/class）
- `report_type`: 报告类型（daily/weekly/monthly/custom）
- `statistics`: 统计数据（JSON格式）
- `trend_data`: 趋势数据（JSON格式）
- `weak_points`: 薄弱知识点数据（JSON格式）
- `ai_analysis`: BERT模型生成的学情分析
- `knowledge_mastery_score`: 知识点掌握度评分（0-100）
- `pdf_url`: PDF报告URL

**测试数据**：10条（7条学生报告 + 3条班级报告）

---

### 2. offline_cache_records (离线缓存记录表)

**需求**：17.1 - 离线模式与本地缓存

**功能**：记录用户的离线缓存数据，支持离线模式下的学习和增量同步。

**关键字段**：
- `user_id`: 用户ID
- `data_type`: 数据类型（learning_path/error_book/assignment/report/notes/mindmap）
- `cache_data`: 缓存的数据内容（JSON格式）
- `encrypted_data`: AES-256加密后的敏感数据
- `sync_status`: 同步状态（synced/pending/conflict/failed）
- `cache_size`: 缓存大小（字节）
- `expires_at`: 过期时间（30天后）

**测试数据**：50条（覆盖10个学生，每人5种数据类型）

---

### 3. teams (学习小组表)

**需求**：18.1 - 多端协作学习（组队+打卡+互评）

**功能**：存储学习小组的基本信息。

**关键字段**：
- `name`: 小组名称
- `learning_goal`: 学习目标
- `creator_id`: 创建者ID
- `invite_code`: 邀请码（唯一）
- `member_limit`: 成员上限（默认10人）
- `member_count`: 当前成员数
- `status`: 状态（active/disbanded）

**测试数据**：5个小组

---

### 4. team_members (小组成员关联表)

**需求**：18.1 - 小组成员管理

**功能**：记录小组成员关系和贡献度。

**关键字段**：
- `team_id`: 小组ID
- `user_id`: 用户ID
- `role`: 角色（creator/member）
- `contribution_score`: 贡献度评分

**测试数据**：30个成员关系

---

### 5. check_ins (打卡记录表)

**需求**：18.3 - 每日打卡功能

**功能**：记录学生每日学习打卡情况。

**关键字段**：
- `team_id`: 小组ID
- `user_id`: 用户ID
- `check_in_date`: 打卡日期
- `study_duration`: 学习时长（分钟）
- `completed_tasks`: 完成任务数
- `notes`: 打卡笔记

**测试数据**：100条打卡记录

---

### 6. peer_reviews (互评记录表)

**需求**：18.5 - 互评功能

**功能**：记录小组成员间的互评数据。

**关键字段**：
- `team_id`: 小组ID
- `reviewer_id`: 评价人ID
- `reviewee_id`: 被评价人ID
- `assignment_id`: 作业ID（可选）
- `score`: 评分（0-100）
- `comment`: 评语（≤200字）

**测试数据**：40条互评记录

---

### 7. resource_recommendations (资源推荐表)

**需求**：19.2 - 个性化资源推荐（基于学习行为）

**功能**：存储AI推荐的学习资源和用户反馈。

**关键字段**：
- `user_id`: 用户ID
- `resource_type`: 资源类型（article/video/exercise/tutorial/course）
- `resource_title`: 资源标题
- `recommendation_score`: 推荐评分（0-100）
- `recommendation_reason`: 推荐理由
- `related_knowledge_points`: 相关知识点（JSON）
- `is_clicked`: 是否点击
- `feedback`: 用户反馈（interested/not_interested/completed）
- `is_exclusive`: 是否独家资源（会员专享）
- `member_level_required`: 所需会员等级

**测试数据**：100条推荐记录

---

### 8. speech_assessments (口语评测表)

**需求**：20.3 - AI口语评测（英文/中文发音批改）

**功能**：存储口语评测结果和详细批改报告。

**关键字段**：
- `user_id`: 用户ID
- `language`: 语言类型（english/chinese）
- `audio_url`: 音频文件URL
- `audio_duration`: 音频时长（秒）
- `pronunciation_score`: 发音准确率（0-100）
- `intonation_score`: 语调评分（0-100）
- `fluency_score`: 流畅度评分（0-100）
- `overall_score`: 综合评分（0-100）
- `detailed_report`: 逐句批改报告（JSON格式）
- `error_points`: 发音错误点标注（JSON）
- `improvement_suggestions`: 改进建议
- `standard_audio_url`: 标准发音示范URL
- `processing_time`: 评测处理时间（毫秒）
- `model_version`: Wav2Vec2模型版本
- `is_priority`: 是否优先评测（会员）

**测试数据**：20条评测记录（12条英语 + 8条中文）

---

## 数据统计

| 表名 | 测试数据量 | 说明 |
|------|-----------|------|
| learning_analytics_reports | 10条 | 学情报告 |
| offline_cache_records | 50条 | 离线缓存记录 |
| teams | 5条 | 学习小组 |
| team_members | 30条 | 小组成员 |
| check_ins | 100条 | 打卡记录 |
| peer_reviews | 40条 | 互评记录 |
| resource_recommendations | 100条 | 资源推荐 |
| speech_assessments | 20条 | 口语评测 |
| **总计** | **355条** | **8张表** |

## 安装说明

### 方法1：使用批处理脚本（推荐）

```bash
cd docs/sql
create-new-tables.bat
```

### 方法2：手动执行SQL

```bash
mysql -u root -p edu_education_platform < new-features-tables.sql
```

## 验证安装

执行以下SQL验证表是否创建成功：

```sql
USE edu_education_platform;

-- 查看所有表
SHOW TABLES;

-- 验证新表数据
SELECT COUNT(*) FROM learning_analytics_reports;
SELECT COUNT(*) FROM offline_cache_records;
SELECT COUNT(*) FROM teams;
SELECT COUNT(*) FROM team_members;
SELECT COUNT(*) FROM check_ins;
SELECT COUNT(*) FROM peer_reviews;
SELECT COUNT(*) FROM resource_recommendations;
SELECT COUNT(*) FROM speech_assessments;
```

预期结果：
- learning_analytics_reports: 10条
- offline_cache_records: 50条
- teams: 5条
- team_members: 30条
- check_ins: 100条
- peer_reviews: 40条
- resource_recommendations: 100条
- speech_assessments: 20条

## 注意事项

1. **字符集**：所有表使用UTF8MB4字符集，支持中文和emoji
2. **外键约束**：所有外键设置为ON DELETE CASCADE，确保数据一致性
3. **索引优化**：已为常用查询字段添加索引
4. **JSON字段**：部分字段使用JSON格式存储复杂数据结构
5. **加密数据**：敏感数据使用AES-256加密存储

## 相关文档

- [需求文档](../../.kiro/specs/smart-education-platform/requirements.md)
- [设计文档](../../.kiro/specs/smart-education-platform/design.md)
- [任务列表](../../.kiro/specs/smart-education-platform/tasks.md)

## 更新日志

- 2026-01-15: 创建8张新表，插入355条测试数据

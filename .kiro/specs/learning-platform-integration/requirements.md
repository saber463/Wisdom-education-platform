# Requirements Document - Learning Platform Integration

## Introduction

本规范定义了将 learning-ai-platform 项目作为**主界面**，当前 edu-ai-platform-web 的教学管理功能作为**副界面**的双系统架构需求。两个系统通过统一的用户体系、数据关联和导航切换实现协同工作。

## Glossary

- **Main_Interface**: 主界面，即 learning-ai-platform 的学习平台功能（课程、学习路径、资源分享、AI助手等）
- **Sub_Interface**: 副界面，即当前 edu-ai-platform-web 的教学管理功能（作业管理、批改系统、学情分析等）
- **System_Switch**: 系统切换，用户在主副界面之间的导航切换
- **Course**: 课程，包含编程语言、分支、课节的完整课程体系
- **Course_Branch**: 课程分支，编程语言下的不同学习方向（如前端、后端、数据分析等）
- **Course_Lesson**: 课节，每节课的具体内容
- **Course_Purchase**: 课程购买，学生购买课程后自动分配班级
- **Template_Teacher**: 模板教师，系统预设的固定教师账号
- **Video_Progress**: 视频进度，记录学生观看视频的详细数据（进度、次数、暂停位置）
- **Personalized_Recommendation**: 个性化推荐，基于用户行为和AI算法推荐课程和学习路径
- **Learning_Path**: 个性化学习路径，包含一系列学习步骤和资源
- **Learning_Resource**: 学习资源，包括文章、视频、文档等
- **Learning_Progress**: 学习进度跟踪记录
- **Community**: 学习社区，包含论坛、问答、动态分享
- **Membership**: 会员系统，包含VIP会员和积分系统
- **Mind_Map**: 思维导图，可视化展示学习路径结构
- **Data_Association**: 数据关联，主副界面之间的数据互通和关联
- **Hybrid_Database**: 混合数据库，MySQL存储结构化数据，MongoDB存储行为数据和推荐数据

---

## Requirements

### Requirement 1: 课程体系管理

**User Story**: 作为系统管理员，我希望建立完整的课程体系，以便学生可以系统化地学习编程语言。

#### Acceptance Criteria

1. WHEN 创建编程语言课程 THEN THE System SHALL 包含语言名称、描述、难度级别、热门标记等字段
2. WHEN 创建课程分支 THEN THE System SHALL 支持一个语言下有多个学习方向（如Python的Web开发、数据分析、机器学习等）
3. WHEN 创建课节 THEN THE System SHALL 包含课节标题、内容、视频链接、代码示例、练习题等
4. WHEN 设置课程价格 THEN THE System SHALL 支持免费和付费两种模式
5. WHEN 标记热门语言 THEN THE System SHALL 在首页突出显示热门课程
6. WHEN 查询课程列表 THEN THE System SHALL 按热门度、难度、价格筛选
7. WHEN 查询课程详情 THEN THE System SHALL 显示完整的分支和课节结构
8. WHEN 统计课程数据 THEN THE System SHALL 记录购买人数、完成人数、评分等

### Requirement 2: 课程购买和班级分配

**User Story**: 作为学生，我希望购买课程后自动加入班级，以便接受教师指导和完成作业。

#### Acceptance Criteria

1. WHEN 学生购买课程 THEN THE System SHALL 创建购买记录并扣除费用
2. WHEN 购买成功 THEN THE System SHALL 随机分配到该课程的6个班级之一
3. WHEN 分配班级 THEN THE System SHALL 确保班级人数相对均衡（差距不超过5人）
4. WHEN 加入班级 THEN THE System SHALL 创建class_students关联记录
5. WHEN 加入班级 THEN THE System SHALL 通知学生和对应班级教师
6. WHEN 查询我的课程 THEN THE System SHALL 显示已购买的课程和所在班级
7. WHEN 免费课程 THEN THE System SHALL 直接加入无需支付
8. WHEN 重复购买 THEN THE System SHALL 提示已购买并阻止重复支付

### Requirement 3: 模板教师管理

**User Story**: 作为系统管理员，我希望创建固定的教师模板，以便为课程班级分配教师。

#### Acceptance Criteria

1. WHEN 创建模板教师 THEN THE System SHALL 包含教师姓名、头像、简介、擅长领域等
2. WHEN 创建课程班级 THEN THE System SHALL 为每个语言的每个分支创建6个班级
3. WHEN 分配教师 THEN THE System SHALL 将模板教师分配到对应班级
4. WHEN 查询教师信息 THEN THE System SHALL 显示教师负责的班级和课程
5. WHEN 教师查看班级 THEN THE System SHALL 显示班级学生列表和学习进度
6. WHEN 学生查看教师 THEN THE System SHALL 显示教师简介和联系方式
7. WHEN 更新教师信息 THEN THE System SHALL 支持修改简介和头像
8. WHEN 教师发布公告 THEN THE System SHALL 通知班级所有学生

### Requirement 4: 视频学习追踪系统

**User Story**: 作为教师，我希望查看学生的视频学习详情，以便了解学生的学习投入度和学习习惯。

#### Acceptance Criteria

1. WHEN 学生观看视频 THEN THE System SHALL 每5秒记录一次当前播放位置
2. WHEN 学生暂停视频 THEN THE System SHALL 记录暂停位置和暂停时长
3. WHEN 学生完成视频 THEN THE System SHALL 记录完成时间和总观看时长
4. WHEN 学生重复观看 THEN THE System SHALL 累计观看次数
5. WHEN 教师查看学生进度 THEN THE System SHALL 显示每个学生的视频观看进度百分比
6. WHEN 教师查看详细数据 THEN THE System SHALL 显示观看次数、总时长、平均观看速度
7. WHEN 教师查看热力图 THEN THE System SHALL 显示视频哪些部分被重复观看
8. WHEN 检测异常行为 THEN THE System SHALL 标记快进跳过或挂机行为

### Requirement 5: 个性化推荐系统

**User Story**: 作为学生，我希望看到个性化的课程推荐，以便找到最适合我的学习内容。

#### Acceptance Criteria

1. WHEN 学生首次登录 THEN THE System SHALL 根据注册时选择的兴趣推荐课程
2. WHEN 学生浏览课程 THEN THE System SHALL 记录浏览行为到MongoDB
3. WHEN 学生完成课程 THEN THE System SHALL 基于协同过滤推荐相似课程
4. WHEN 学生访问首页 THEN THE System SHALL 显示个性化推荐的课程列表
5. WHEN 计算推荐 THEN THE System SHALL 综合考虑用户兴趣、学习历史、热门度、难度匹配
6. WHEN 生成学习路径 THEN THE System SHALL 基于学生当前水平和目标自动生成
7. WHEN 推荐资源 THEN THE System SHALL 基于学生薄弱知识点推荐相关资源
8. WHEN 更新推荐 THEN THE System SHALL 每天凌晨重新计算推荐结果

### Requirement 6: 混合数据库架构

**User Story**: 作为学生，我希望跟踪我的课程学习进度，以便了解学习情况。

#### Acceptance Criteria

1. WHEN 开始学习课程 THEN THE System SHALL 创建课程进度记录
2. WHEN 完成一节课 THEN THE System SHALL 更新进度并解锁下一节课
3. WHEN 查看课程进度 THEN THE System SHALL 显示已完成课节、当前课节、总进度百分比
4. WHEN 学习课节 THEN THE System SHALL 记录学习时长
5. WHEN 完成课节练习 THEN THE System SHALL 自动批改并记录成绩
6. WHEN 完成整个课程 THEN THE System SHALL 颁发结业证书
7. WHEN 暂停学习 THEN THE System SHALL 保存当前进度
8. WHEN 继续学习 THEN THE System SHALL 从上次位置继续

### Requirement 9: 数据库架构扩展

**User Story**: 作为学生，我希望看到热门编程语言课程，以便选择流行的技术学习。

#### Acceptance Criteria

1. WHEN 访问课程首页 THEN THE System SHALL 显示热门语言排行榜
2. WHEN 标记热门语言 THEN THE System SHALL 在列表中优先展示
3. WHEN 计算热门度 THEN THE System SHALL 基于购买人数、完成率、评分综合计算
4. WHEN 查看热门语言 THEN THE System SHALL 显示语言图标、简介、学习人数
5. WHEN 点击热门语言 THEN THE System SHALL 跳转到该语言的课程详情页
6. WHEN 搜索课程 THEN THE System SHALL 支持按语言名称、分支名称搜索
7. WHEN 筛选课程 THEN THE System SHALL 支持按难度、价格、热门度筛选
8. WHEN 推荐课程 THEN THE System SHALL 基于用户兴趣推荐相关课程

**User Story**: 作为系统架构师，我希望使用混合数据库架构，以便高效存储结构化数据和行为数据。

#### Acceptance Criteria

1. WHEN 存储用户基础信息 THEN THE System SHALL 使用MySQL存储
2. WHEN 存储课程结构数据 THEN THE System SHALL 使用MySQL存储
3. WHEN 记录用户行为 THEN THE System SHALL 使用MongoDB存储（浏览、点击、观看）
4. WHEN 存储推荐结果 THEN THE System SHALL 使用MongoDB存储
5. WHEN 存储视频进度详情 THEN THE System SHALL 使用MongoDB存储（支持频繁更新）
6. WHEN 存储社区内容 THEN THE System SHALL 使用MongoDB存储（支持富文本和嵌套结构）
7. WHEN 查询数据 THEN THE System SHALL 根据数据类型自动选择数据库
8. WHEN 数据同步 THEN THE System SHALL 保持MySQL和MongoDB的用户ID一致性

**User Story**: 作为学生，我希望跟踪我的课程学习进度，以便了解学习情况。

#### Acceptance Criteria

1. WHEN 开始学习课程 THEN THE System SHALL 创建课程进度记录
2. WHEN 完成一节课 THEN THE System SHALL 更新进度并解锁下一节课
3. WHEN 查看课程进度 THEN THE System SHALL 显示已完成课节、当前课节、总进度百分比
4. WHEN 学习课节 THEN THE System SHALL 记录学习时长到MongoDB
5. WHEN 完成课节练习 THEN THE System SHALL 自动批改并记录成绩
6. WHEN 完成整个课程 THEN THE System SHALL 颁发结业证书
7. WHEN 暂停学习 THEN THE System SHALL 保存当前进度和视频位置
8. WHEN 继续学习 THEN THE System SHALL 从上次位置继续

### Requirement 8: 热门语言推荐

**User Story**: 作为系统架构师，我希望扩展MySQL数据库架构以支持课程系统和学习功能，以便存储课程、班级、学习路径、资源和进度数据。

#### Acceptance Criteria

1. WHEN 创建课程表 THEN THE System SHALL 包含语言名称、描述、难度、价格、热门标记等字段
2. WHEN 创建课程分支表 THEN THE System SHALL 支持一个课程下有多个分支
3. WHEN 创建课节表 THEN THE System SHALL 包含课节标题、内容、视频、代码示例等
4. WHEN 创建课程购买表 THEN THE System SHALL 记录购买记录和支付信息
5. WHEN 创建课程进度表 THEN THE System SHALL 跟踪学生的课程学习进度
6. WHEN 创建课程班级表 THEN THE System SHALL 为每个课程分支创建6个班级
7. WHEN 创建学习路径表 THEN THE System SHALL 包含id、user_id、title、description、difficulty、status等字段
8. WHEN 创建学习路径步骤表 THEN THE System SHALL 支持多步骤学习路径，包含步骤编号、内容、资源类型等
9. WHEN 创建学习资源表 THEN THE System SHALL 支持多种资源类型（article、video、document、link、course）
10. WHEN 创建资源收藏表 THEN THE System SHALL 支持用户收藏资源功能
11. WHEN 创建学习进度表 THEN THE System SHALL 跟踪用户在学习路径中的进度
12. WHEN 扩展通知表 THEN THE System SHALL 添加优先级、操作链接、过期时间等字段
13. WHEN 执行数据库迁移 THEN THE System SHALL 保持现有数据完整性
14. WHEN 添加索引 THEN THE System SHALL 优化查询性能

### Requirement 7: 学习路径管理（后端）

**User Story**: 作为开发者，我希望实现学习路径管理的后端API，以便支持学习路径的创建、查询、更新和删除。

#### Acceptance Criteria

1. WHEN 教师创建学习路径 THEN THE System SHALL 验证必填字段并存储到数据库
2. WHEN 查询学习路径列表 THEN THE System SHALL 根据用户角色返回相应的学习路径
3. WHEN 查询学习路径详情 THEN THE System SHALL 返回完整的步骤信息和资源链接
4. WHEN 更新学习路径 THEN THE System SHALL 验证权限并更新数据
5. WHEN 删除学习路径 THEN THE System SHALL 级联删除相关步骤和进度记录
6. WHEN 学生选择学习路径 THEN THE System SHALL 创建学习进度记录
7. WHEN 更新学习进度 THEN THE System SHALL 记录当前步骤和完成百分比
8. WHEN 完成学习路径 THEN THE System SHALL 标记为已完成并记录完成时间

### Requirement 8: 学习资源管理（后端）

**User Story**: 作为开发者，我希望实现学习资源管理的后端API，以便支持资源的分享、收藏和推荐。

#### Acceptance Criteria

1. WHEN 用户创建学习资源 THEN THE System SHALL 验证资源类型和URL有效性
2. WHEN 查询资源列表 THEN THE System SHALL 支持按类型、分类、标签筛选
3. WHEN 查询资源详情 THEN THE System SHALL 增加浏览计数
4. WHEN 用户收藏资源 THEN THE System SHALL 创建收藏记录
5. WHEN 用户取消收藏 THEN THE System SHALL 删除收藏记录
6. WHEN 用户点赞资源 THEN THE System SHALL 增加点赞计数
7. WHEN 查询用户收藏 THEN THE System SHALL 返回用户的所有收藏资源
8. WHEN 推荐资源 THEN THE System SHALL 基于用户兴趣和学习历史推荐

### Requirement 9: 增强通知系统（后端）

**User Story**: 作为开发者，我希望增强现有通知系统，以便支持优先级、操作链接和过期时间。

#### Acceptance Criteria

1. WHEN 创建通知 THEN THE System SHALL 支持设置优先级（low、medium、high、urgent）
2. WHEN 创建通知 THEN THE System SHALL 支持添加操作链接
3. WHEN 创建通知 THEN THE System SHALL 支持设置过期时间
4. WHEN 查询通知列表 THEN THE System SHALL 按优先级和创建时间排序
5. WHEN 查询通知列表 THEN THE System SHALL 过滤已过期的通知
6. WHEN 标记通知已读 THEN THE System SHALL 更新is_read字段
7. WHEN 批量标记已读 THEN THE System SHALL 支持批量更新多条通知
8. WHEN 删除过期通知 THEN THE System SHALL 定期清理过期通知

### Requirement 10: 课程评价系统

**User Story**: 作为学生，我希望评价课程质量，以便帮助其他学生选择课程。

#### Acceptance Criteria

1. WHEN 学生完成课程 THEN THE System SHALL 提示进行课程评价
2. WHEN 学生评价课程 THEN THE System SHALL 包含评分（1-5星）、评论内容、标签（如"内容丰富"、"讲解清晰"）
3. WHEN 提交评价 THEN THE System SHALL 验证学生已购买该课程
4. WHEN 查看课程评价 THEN THE System SHALL 显示平均评分、评价总数、评价列表
5. WHEN 其他学生查看评价 THEN THE System SHALL 支持点赞有帮助的评价
6. WHEN 评价被点赞 THEN THE System SHALL 按点赞数排序显示
7. WHEN 教师回复评价 THEN THE System SHALL 显示教师回复内容
8. WHEN 举报不当评价 THEN THE System SHALL 支持举报和审核机制

### Requirement 11: 学习社区功能

**User Story**: 作为学生，我希望在学习社区中交流讨论，以便解决学习问题和分享经验。

#### Acceptance Criteria

1. WHEN 学生访问社区 THEN THE System SHALL 显示论坛、问答、动态三个板块
2. WHEN 学生发帖 THEN THE System SHALL 支持富文本编辑、代码高亮、图片上传
3. WHEN 学生提问 THEN THE System SHALL 支持标记问题类型、相关课程、知识点
4. WHEN 其他学生回答 THEN THE System SHALL 支持回答、评论、点赞
5. WHEN 提问者采纳答案 THEN THE System SHALL 标记最佳答案并奖励积分
6. WHEN 学生发布动态 THEN THE System SHALL 支持分享学习心得、项目作品
7. WHEN 创建学习小组 THEN THE System SHALL 支持小组讨论、资源共享
8. WHEN 搜索社区内容 THEN THE System SHALL 支持按关键词、标签、课程搜索

### Requirement 12: 学习路径思维导图

**User Story**: 作为学生，我希望看到学习路径的思维导图，以便直观了解学习结构。

#### Acceptance Criteria

1. WHEN 查看学习路径 THEN THE System SHALL 提供思维导图视图切换
2. WHEN 显示思维导图 THEN THE System SHALL 使用树状结构展示路径和步骤
3. WHEN 点击节点 THEN THE System SHALL 显示该步骤的详细信息
4. WHEN 完成步骤 THEN THE System SHALL 在思维导图中标记为已完成（绿色）
5. WHEN 当前学习步骤 THEN THE System SHALL 在思维导图中高亮显示（蓝色）
6. WHEN 未解锁步骤 THEN THE System SHALL 在思维导图中显示为灰色
7. WHEN 导出思维导图 THEN THE System SHALL 支持导出为图片或PDF
8. WHEN 分享思维导图 THEN THE System SHALL 生成分享链接

### Requirement 13: 会员功能

**User Story**: 作为学生，我希望成为VIP会员，以便享受更多学习特权。

#### Acceptance Criteria

1. WHEN 学生购买会员 THEN THE System SHALL 支持月度、季度、年度会员套餐
2. WHEN 成为会员 THEN THE System SHALL 解锁VIP专属课程和资源
3. WHEN 会员学习 THEN THE System SHALL 获得双倍积分奖励
4. WHEN 会员提问 THEN THE System SHALL 优先获得教师回答
5. WHEN 会员下载 THEN THE System SHALL 无限制下载学习资料
6. WHEN 会员观看 THEN THE System SHALL 支持高清视频和离线下载
7. WHEN 查看会员中心 THEN THE System SHALL 显示会员等级、特权、到期时间
8. WHEN 会员到期 THEN THE System SHALL 提前7天提醒续费

### Requirement 14: 积分系统

**User Story**: 作为学生，我希望通过学习和互动获得积分，以便兑换奖励。

#### Acceptance Criteria

1. WHEN 学生完成课节 THEN THE System SHALL 奖励10积分
2. WHEN 学生完成课程 THEN THE System SHALL 奖励100积分
3. WHEN 学生发布优质内容 THEN THE System SHALL 奖励20-50积分
4. WHEN 学生回答被采纳 THEN THE System SHALL 奖励30积分
5. WHEN 学生每日签到 THEN THE System SHALL 奖励5积分
6. WHEN 学生连续签到 THEN THE System SHALL 额外奖励（7天+10分，30天+50分）
7. WHEN 学生兑换奖励 THEN THE System SHALL 支持兑换课程优惠券、会员时长
8. WHEN 查看积分明细 THEN THE System SHALL 显示积分获取和消费记录

### Requirement 15: 课程前端界面

**User Story**: 作为学生，我希望浏览和购买课程，以便系统化地学习编程语言。

#### Acceptance Criteria

1. WHEN 学生访问课程首页 THEN THE System SHALL 显示热门语言和课程分类
2. WHEN 学生查看课程详情 THEN THE System SHALL 显示课程分支、课节列表、价格、教师信息
3. WHEN 学生购买课程 THEN THE System SHALL 显示支付界面并处理支付
4. WHEN 购买成功 THEN THE System SHALL 显示分配的班级和教师信息
5. WHEN 学生开始学习 THEN THE System SHALL 显示课节内容和进度条
6. WHEN 学生完成课节 THEN THE System SHALL 解锁下一课节并更新进度
7. WHEN 学生查看我的课程 THEN THE System SHALL 显示已购买课程和学习进度
8. WHEN 学生完成课程 THEN THE System SHALL 显示结业证书

### Requirement 16: 学习路径前端界面

**User Story**: 作为学生，我希望浏览和选择学习路径，以便按照个性化计划学习。

#### Acceptance Criteria

1. WHEN 学生访问学习路径页面 THEN THE System SHALL 显示可用的学习路径列表
2. WHEN 学生查看学习路径详情 THEN THE System SHALL 显示所有步骤和预计时间
3. WHEN 学生开始学习路径 THEN THE System SHALL 创建进度记录并跳转到第一步
4. WHEN 学生完成一个步骤 THEN THE System SHALL 更新进度并显示下一步
5. WHEN 学生查看学习进度 THEN THE System SHALL 显示完成百分比和已用时间
6. WHEN 学生暂停学习 THEN THE System SHALL 保存当前进度
7. WHEN 学生继续学习 THEN THE System SHALL 从上次位置继续
8. WHEN 学生完成学习路径 THEN THE System SHALL 显示完成祝贺并提供证书

### Requirement 17: 学习资源前端界面

**User Story**: 作为用户，我希望浏览、搜索和收藏学习资源，以便找到适合的学习材料。

#### Acceptance Criteria

1. WHEN 用户访问资源页面 THEN THE System SHALL 显示资源列表和筛选选项
2. WHEN 用户搜索资源 THEN THE System SHALL 按标题、描述、标签搜索
3. WHEN 用户筛选资源 THEN THE System SHALL 按类型、分类筛选
4. WHEN 用户查看资源详情 THEN THE System SHALL 显示完整信息和相关资源
5. WHEN 用户收藏资源 THEN THE System SHALL 添加到收藏列表
6. WHEN 用户取消收藏 THEN THE System SHALL 从收藏列表移除
7. WHEN 用户点赞资源 THEN THE System SHALL 增加点赞数并更新UI
8. WHEN 用户查看收藏列表 THEN THE System SHALL 显示所有收藏的资源

### Requirement 18: 教师端课程管理

**User Story**: 作为教师，我希望管理我的课程班级，以便为学生提供指导和作业。

#### Acceptance Criteria

1. WHEN 教师登录系统 THEN THE System SHALL 显示负责的班级列表
2. WHEN 教师查看班级 THEN THE System SHALL 显示学生列表和学习进度
3. WHEN 教师发布公告 THEN THE System SHALL 通知班级所有学生
4. WHEN 教师创建作业 THEN THE System SHALL 关联到课程的某个课节
5. WHEN 教师查看学生进度 THEN THE System SHALL 显示每个学生的课程完成情况
6. WHEN 教师批改作业 THEN THE System SHALL 更新学生的课节完成状态
7. WHEN 教师查看统计 THEN THE System SHALL 显示班级整体学习情况
8. WHEN 教师与学生沟通 THEN THE System SHALL 提供消息功能

### Requirement 19: 教师端学习路径管理

**User Story**: 作为教师，我希望创建和管理学习路径，以便为学生提供个性化学习计划。

#### Acceptance Criteria

1. WHEN 教师创建学习路径 THEN THE System SHALL 提供表单输入标题、描述、难度
2. WHEN 教师添加学习步骤 THEN THE System SHALL 支持拖拽排序和编辑
3. WHEN 教师添加资源链接 THEN THE System SHALL 验证URL有效性
4. WHEN 教师预览学习路径 THEN THE System SHALL 显示学生视角的完整路径
5. WHEN 教师发布学习路径 THEN THE System SHALL 通知相关学生
6. WHEN 教师查看学习路径统计 THEN THE System SHALL 显示学生完成情况
7. WHEN 教师编辑学习路径 THEN THE System SHALL 保留学生的进度记录
8. WHEN 教师删除学习路径 THEN THE System SHALL 提示确认并清理相关数据

### Requirement 15: 家长端学习监控

**User Story**: 作为家长，我希望查看孩子的学习路径和进度，以便了解学习情况。

#### Acceptance Criteria

1. WHEN 家长登录系统 THEN THE System SHALL 显示关联孩子的学习概况
2. WHEN 家长查看学习路径 THEN THE System SHALL 显示孩子正在学习的路径
3. WHEN 家长查看学习进度 THEN THE System SHALL 显示完成百分比和时间统计
4. WHEN 家长查看学习资源 THEN THE System SHALL 显示孩子收藏的资源
5. WHEN 家长查看学习历史 THEN THE System SHALL 显示最近的学习活动
6. WHEN 家长设置学习提醒 THEN THE System SHALL 在指定时间推送通知
7. WHEN 家长查看学习报告 THEN THE System SHALL 生成周报或月报
8. WHEN 家长与教师沟通 THEN THE System SHALL 提供消息功能

### Requirement 16: Tailwind CSS集成

**User Story**: 作为前端开发者，我希望集成Tailwind CSS，以便使用现代化的样式系统。

#### Acceptance Criteria

1. WHEN 安装Tailwind CSS THEN THE System SHALL 配置PostCSS和Autoprefixer
2. WHEN 配置Tailwind THEN THE System SHALL 扫描所有Vue文件
3. WHEN 定义主题色 THEN THE System SHALL 扩展默认颜色配置
4. WHEN 使用Tailwind类 THEN THE System SHALL 与Element Plus兼容
5. WHEN 构建生产版本 THEN THE System SHALL 自动清除未使用的样式
6. WHEN 使用响应式类 THEN THE System SHALL 支持移动端适配
7. WHEN 自定义组件样式 THEN THE System SHALL 支持@apply指令
8. WHEN 使用暗色模式 THEN THE System SHALL 支持dark:前缀

### Requirement 10: AI服务集成

**User Story**: 作为系统管理员，我希望集成多种AI服务，以便提供更智能的学习建议。

#### Acceptance Criteria

1. WHEN 集成Qwen3模型 THEN THE System SHALL 支持文本嵌入和聊天功能
2. WHEN 集成百度AI THEN THE System SHALL 支持学习行为分析
3. WHEN 集成讯飞AI THEN THE System SHALL 支持语音识别和合成
4. WHEN 生成学习路径 THEN THE System SHALL 基于用户兴趣和AI推荐
5. WHEN 分析学习行为 THEN THE System SHALL 识别学习模式和薄弱点
6. WHEN 推荐学习资源 THEN THE System SHALL 基于内容相似度和用户偏好
7. WHEN AI服务失败 THEN THE System SHALL 降级到基础算法
8. WHEN 调用AI服务 THEN THE System SHALL 记录日志和性能指标

### Requirement 20: 用户兴趣调查问卷

**User Story**: 作为新用户，我希望在首次登录时填写兴趣调查问卷，以便系统为我推荐个性化的学习内容。

#### Acceptance Criteria

1. WHEN 用户首次登录系统 THEN THE System SHALL 显示强制弹窗调查问卷
2. WHEN 显示问卷弹窗 THEN THE System SHALL 阻止用户关闭或跳过（必须完成）
3. WHEN 问卷包含问题 THEN THE System SHALL 询问学习目标（就业、兴趣、考试、项目）
4. WHEN 问卷包含问题 THEN THE System SHALL 询问感兴趣的编程语言（多选：Python、JavaScript、Java、C++、Go等）
5. WHEN 问卷包含问题 THEN THE System SHALL 询问感兴趣的技术方向（多选：前端、后端、移动端、数据分析、AI、游戏开发等）
6. WHEN 问卷包含问题 THEN THE System SHALL 询问当前技能水平（初学者、有基础、熟练、专家）
7. WHEN 问卷包含问题 THEN THE System SHALL 询问每周可学习时间（<5小时、5-10小时、10-20小时、>20小时）
8. WHEN 问卷包含问题 THEN THE System SHALL 询问偏好的学习方式（视频、文档、实战项目、互动练习）
9. WHEN 用户提交问卷 THEN THE System SHALL 验证所有必填项已填写
10. WHEN 提交成功 THEN THE System SHALL 保存用户兴趣数据到user_interests表
11. WHEN 提交成功 THEN THE System SHALL 关闭弹窗并跳转到个性化推荐首页
12. WHEN 用户再次登录 THEN THE System SHALL 不再显示问卷弹窗
13. WHEN 用户修改兴趣 THEN THE System SHALL 在个人中心提供"重新设置兴趣"功能
14. WHEN 基于问卷数据 THEN THE System SHALL 生成个性化课程推荐
15. WHEN 基于问卷数据 THEN THE System SHALL 生成推荐学习路径
16. WHEN 基于问卷数据 THEN THE System SHALL 调整首页展示内容

### Requirement 21: AI驱动的学习路径动态规划

**User Story**: 作为学生，我希望系统能根据我的学习情况自动调整课程顺序，跳过已掌握的内容，针对薄弱点提供补强练习，以便提高学习效率。

#### Acceptance Criteria

1. WHEN 学生观看视频 THEN THE System SHALL 记录暂停点、回看次数、快进率到MongoDB
2. WHEN 学生完成练习 THEN THE System SHALL 记录错误模式（语法/逻辑/性能错误分类）和知识点标签
3. WHEN 学生完成课节 THEN THE System SHALL 记录完成时长和资源浏览记录
4. WHEN 收集到学习数据 THEN THE System SHALL 数据采集延迟不超过5秒
5. WHEN 调用AI分析 THEN THE System SHALL 使用Qwen3模型和百度AI评估知识点掌握度
6. WHEN 评估知识点掌握度 THEN THE System SHALL 按正确率分为已掌握（≥85%）、待巩固（60%-84%）、薄弱（<60%）三级
7. WHEN 识别错误模式 THEN THE System SHALL 关联代码错误到对应知识点
8. WHEN 生成学习能力画像 THEN THE System SHALL 基于完成时长和重复练习次数标注为高效型/稳健型/基础型
9. WHEN 知识点已掌握 THEN THE System SHALL 在学习路径中隐藏对应课节并更新思维导图标记
10. WHEN 知识点薄弱 THEN THE System SHALL 优先推送微课程（5-10分钟）、针对性练习题（3-5道）、答疑案例
11. WHEN 用户为高效型 THEN THE System SHALL 跳过基础讲解并增加进阶实战项目
12. WHEN 用户为基础型 THEN THE System SHALL 降低难度梯度并增加分步指导
13. WHEN 完成任意学习任务 THEN THE System SHALL 在100ms内触发AI重新评估
14. WHEN 路径调整完成 THEN THE System SHALL 在300ms内更新前端显示
15. WHEN 显示学习路径 THEN THE System SHALL 标注推荐优先学（红色）、正常学（黑色）、已掌握（灰色）
16. WHEN 调整路径 THEN THE System SHALL 显示动态调整说明（如"检测到你对装饰器掌握薄弱，已添加3道针对性练习"）
17. WHEN 查看个人中心 THEN THE System SHALL 显示当前知识掌握画像和路径调整日志
18. WHEN 用户关闭动态调整 THEN THE System SHALL 恢复默认路径并记录用户选择
19. WHEN 路径调整后 THEN THE System SHALL 同步至学习进度表、思维导图、家长端学习报告
20. WHEN AI评估知识点 THEN THE System SHALL 与教师人工评估一致率达到80%以上

### Requirement 22: 虚拟学习伙伴

**User Story**: 作为学生，我希望有一个进度相近的虚拟学习伙伴一起打卡、完成任务、互相鼓励，让学习不孤单且更有趣。

#### Acceptance Criteria

1. WHEN 用户首次选择学习路径 THEN THE System SHALL 自动生成1个主伙伴和最多2个备选伙伴
2. WHEN 匹配伙伴 THEN THE System SHALL 确保学习路径相同、进度差距≤5%、学习能力标签一致、兴趣方向重合
3. WHEN 生成伙伴人设 THEN THE System SHALL 随机生成姓名、头像、个性签名
4. WHEN 伙伴人设生成 THEN THE System SHALL 确保人设与学习能力标签匹配
5. WHEN 到达用户高频学习时段 THEN THE System SHALL 伙伴发送鼓励消息
6. WHEN 伙伴发送消息 THEN THE System SHALL 基于当前课节知识点生成学习心得
7. WHEN 每日任务生成 THEN THE System SHALL 创建1个双人任务（如一起完成3道练习题）
8. WHEN 双方完成共同任务 THEN THE System SHALL 各自获得基础积分×1.5和伙伴协作徽章碎片
9. WHEN 显示进度比拼 THEN THE System SHALL 实时显示伙伴与用户的进度差
10. WHEN 每周结束 THEN THE System SHALL 生成协作排行榜（按共同任务完成次数排序）
11. WHEN 伙伴等级提升 THEN THE System SHALL 解锁更多互动话术和共同任务奖励
12. WHEN 用户遇到问题 THEN THE System SHALL 伙伴基于答疑知识库提供初步解答
13. WHEN 伙伴无法解答 THEN THE System SHALL 引导用户至实时答疑室或教师
14. WHEN 共同任务即将到期 THEN THE System SHALL 伙伴提醒用户（如"还有24小时截止"）
15. WHEN 用户完成课程 THEN THE System SHALL 伙伴发送祝贺消息
16. WHEN 用户完成课程 THEN THE System SHALL 支持将协作成果分享至社区
17. WHEN 伙伴匹配完成 THEN THE System SHALL 进度差距≤5%且兴趣重合度≥60%
18. WHEN 伙伴生成话术 THEN THE System SHALL 无语法错误且与当前学习内容相关性≥90%
19. WHEN 伙伴发送消息 THEN THE System SHALL 响应时间≤200ms
20. WHEN 共同任务完成 THEN THE System SHALL 积分和徽章自动到账且与现有积分系统一致
21. WHEN 用户访问个人中心 THEN THE System SHALL 支持关闭/开启虚拟伙伴、切换伙伴人设、调整互动频率

### Requirement 23: 视频随机答题与错题本

**User Story**: 作为学生，我希望在观看视频时随机出现答题环节，以便检验学习效果；作为教师和家长，我希望实时查看学生的答题情况和错题记录，以便及时了解学习薄弱点。

#### Acceptance Criteria

1. WHEN 学生观看课程视频 THEN THE System SHALL 在随机时间点（10-20分钟之间）暂停视频并弹出答题框
2. WHEN 弹出答题框 THEN THE System SHALL 显示与当前视频内容相关的选择题或填空题
3. WHEN 弹出答题框 THEN THE System SHALL 阻止视频继续播放直到学生提交答案
4. WHEN 学生提交答案 THEN THE System SHALL 立即判断正误并显示正确答案和解析
5. WHEN 学生答对题目 THEN THE System SHALL 奖励5积分并继续播放视频
6. WHEN 学生答错题目 THEN THE System SHALL 自动添加到错题本并继续播放视频
7. WHEN 题目添加到错题本 THEN THE System SHALL 记录视频ID、题目ID、错误答案、正确答案、答题时间、知识点标签
8. WHEN 题目添加到错题本 THEN THE System SHALL 实时同步通知教师和家长
9. WHEN 教师查看错题本 THEN THE System SHALL 显示学生姓名、视频名称、题目内容、错误答案、答题时间
10. WHEN 家长查看错题本 THEN THE System SHALL 显示孩子的错题列表、错题统计、薄弱知识点分析
11. WHEN 学生查看错题本 THEN THE System SHALL 支持按视频、知识点、时间筛选错题
12. WHEN 学生查看错题 THEN THE System SHALL 显示错题详情、正确答案、解析、相关知识点链接
13. WHEN 学生重做错题 THEN THE System SHALL 记录重做次数和正确率
14. WHEN 学生答对错题 THEN THE System SHALL 标记为"已掌握"并从错题本移除
15. WHEN 生成答题统计 THEN THE System SHALL 显示总答题数、正确率、错题数、薄弱知识点TOP5
16. WHEN 视频答题触发 THEN THE System SHALL 确保同一视频不在相同时间点重复出题
17. WHEN 视频答题触发 THEN THE System SHALL 每个视频最多触发3次答题
18. WHEN 答题框显示 THEN THE System SHALL 倒计时60秒，超时自动提交并标记为错误
19. WHEN 错题本更新 THEN THE System SHALL 触发AI重新评估知识点掌握度
20. WHEN 错题本同步 THEN THE System SHALL 延迟不超过3秒通知教师和家长

---

## 非功能性需求

### 性能要求

1. 学习路径列表查询响应时间 < 500ms
2. 资源搜索响应时间 < 1s
3. 学习进度更新响应时间 < 200ms
4. 支持至少1000个并发用户

### 安全要求

1. 所有API端点需要JWT认证
2. 角色权限验证（教师、学生、家长）
3. 敏感数据加密存储
4. SQL注入防护
5. XSS攻击防护

### 兼容性要求

1. 保持与现有功能的完全兼容
2. 不影响现有数据库数据
3. 支持渐进式迁移
4. 支持功能开关（可选启用新功能）

### 可维护性要求

1. 代码使用TypeScript编写
2. 遵循现有代码规范
3. 添加完整的注释和文档
4. 编写单元测试和集成测试

---

**创建时间**: 2026-01-23 01:35  
**状态**: 待审核

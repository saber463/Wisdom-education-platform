# 实施计划 - 系统审计与生产就绪优化

## 概述

本实施计划将系统审计与bug修复工作分解为离散的编码任务，采用增量修复方式，每个任务都建立在前序任务的基础上。所有任务均针对生产就绪标准优化，确保测试通过率达到100%，所有API错误得到修复，系统性能和稳定性得到显著提升。

**修复目标**：
- 测试通过率：38.46% → 100%
- API错误：修复所有500/403/404/400/503错误
- 数据库：符合MySQL 8.0严格模式，优化查询性能
- 代码质量：符合ESLint规范，模块化和规范化
- 部署稳定性：自动化部署，故障自动恢复

## 任务列表

### 第一阶段：API错误修复（第1周）

- [x] 1. 修复作业接口500错误 ✅
  - [x] 1.1 修复MySQL GROUP BY语法错误 ✅
    - ✅ 检查所有包含GROUP BY的SQL语句
    - ✅ 确保所有非聚合列都包含在GROUP BY中
    - ✅ 测试修复后的SQL语句
    - _需求：1.2_
    - **修复位置**: `backend/src/routes/assignments.ts` - GET /api/assignments
    - **修复内容**: 在GROUP BY子句中包含所有非聚合列（a.id, a.title, a.description, a.class_id, a.teacher_id, a.difficulty, a.total_score, a.deadline, a.status, a.created_at, a.updated_at, c.name, u.real_name）

  - [x] 1.2 添加参数校验中间件 ✅
    - ✅ 创建参数校验逻辑
    - ✅ 应用到作业相关接口
    - ✅ 测试参数缺失场景
    - _需求：1.4_
    - **修复位置**: `backend/src/routes/assignments.ts` - 所有接口
    - **修复内容**: 
      - 分页参数校验（page: 1-∞, limit: 1-100）
      - ID参数校验（必须是有效整数）
      - 必填字段校验（title, class_id, total_score, deadline）

  - [x] 1.3 添加详细错误日志 ✅
    - ✅ 记录SQL执行错误
    - ✅ 记录请求参数和堆栈信息
    - ✅ 配置日志格式（ISO时间戳 + 结构化信息）
    - _需求：1.3_
    - **修复位置**: `backend/src/routes/assignments.ts` - 所有接口的try-catch块
    - **修复内容**: 
      - 成功日志：时间戳、用户ID、角色、执行时长、参数
      - 错误日志：时间戳、错误消息、堆栈、URL、方法、参数、用户ID、执行时长

  - [x] 1.4 实现数据库连接重试机制 ✅
    - ✅ 连接失败自动重试3次
    - ✅ 记录重试日志
    - ✅ 测试连接失败场景
    - _需求：1.5_
    - **修复位置**: `backend/src/config/database.ts` - connectWithRetry函数
    - **修复内容**: 
      - 最大重试次数：3次
      - 重试间隔：2秒
      - 自动端口检测：3306, 3307, 3308
      - 详细的重试日志记录

  - **验证文件**: 
    - `test-scripts/task1-verification.sh` - 自动化验证脚本
    - `docs/task1-implementation-summary.md` - 详细实施总结
  
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证

- [x] 2. 修复批改查询404错误 ✅
  - [x] 2.1 统一接口路径 ✅
    - ✅ 修改接口路径为/api/grading/assignment/:assignment_id
    - ✅ 更新测试脚本中的接口路径
    - ✅ 测试路径一致性
    - _需求：2.3_
    - **修复位置**: `backend/src/routes/grading.ts` - 新增 GET /api/grading/assignment/:assignment_id
    - **修复内容**: 
      - 新增统一接口路径，支持可选的student_id查询参数
      - 保留旧路径并重定向到新路径（向后兼容）
      - 支持多角色权限控制（学生、教师、家长、管理员）

  - [x] 2.2 修改返回逻辑 ✅
    - ✅ 无数据时返回空数组而非404
    - ✅ 统一返回格式{code, msg, data}
    - ✅ 测试无数据场景
    - _需求：2.2_
    - **修复位置**: `backend/src/routes/grading.ts` - GET /api/grading/assignment/:assignment_id
    - **修复内容**: 
      - 作业不存在时返回404
      - 作业存在但无提交记录时返回200和空数组[]
      - 统一返回格式：{code: number, msg: string, data: any}
      - 区分不同错误场景（404 vs 200+空数组）

  - [x] 2.3 添加查询参数校验 ✅
    - ✅ 校验assignment_id参数（必填，必须是有效整数）
    - ✅ 校验student_id参数（可选，如提供必须是有效整数）
    - ✅ 返回明确错误信息
    - _需求：2.4_
    - **修复位置**: `backend/src/routes/grading.ts` - GET /api/grading/assignment/:assignment_id
    - **修复内容**: 
      - assignment_id参数校验（必填，整数类型）
      - student_id参数校验（可选，整数类型）
      - 权限校验（学生、教师、家长、管理员）
      - 详细的错误日志记录（时间戳、用户信息、参数、执行时长）

  - **验证文件**: 
    - `test-scripts/task2-verification.sh` - 自动化验证脚本（10个测试用例）
    - `docs/task2-implementation-summary.md` - 详细实施总结
  
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证

- [x] 3. 修复薄弱点分析400错误 ✅
  - [x] 3.1 添加class_id参数校验 ✅
    - ✅ 校验class_id或student_id必填（至少提供一个）
    - ✅ 返回明确错误提示
    - ✅ 测试参数缺失场景
    - _需求：3.2_
    - **修复位置**: `backend/src/routes/analytics.ts` - GET /api/analytics/weak-points
    - **修复内容**: 
      - 添加参数校验逻辑，确保class_id或student_id至少提供一个
      - 返回400错误和明确的错误提示："缺少必填参数：class_id或student_id（至少提供一个）"
      - 详细的错误日志记录（时间戳、用户信息、参数、执行时长）

  - [x] 3.2 完善权限校验逻辑 ✅
    - ✅ 学生只能查询自己的薄弱点
    - ✅ 教师只能查询本班学生薄弱点
    - ✅ 管理员无限制
    - ✅ 测试各角色权限
    - _需求：3.3, 3.4, 3.5_
    - **修复位置**: `backend/src/routes/analytics.ts` - GET /api/analytics/weak-points
    - **修复内容**: 
      - 管理员：无限制，可查询任意班级或学生
      - 教师：只能查询本班学生（通过class_id或student_id）
      - 学生：只能查询自己的薄弱点
      - 家长：只能查询自己孩子的薄弱点
      - 返回403错误和明确的权限错误提示
      - 详细的权限校验日志记录

  - **验证文件**: 
    - `test-scripts/task3-verification.sh` - 自动化验证脚本（12个测试用例）
    - `docs/task3-implementation-summary.md` - 详细实施总结
  
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证

- [x] 4. 修复个性化推荐403错误 ✅
  - [x] 4.1 优化权限控制逻辑 ✅
    - ✅ 实现学生/教师/管理员权限判断
    - ✅ 教师查询本班学生推荐
    - ✅ 返回明确权限错误信息
    - _需求：4.1, 4.2, 4.3_
    - **修复位置**: `backend/src/routes/recommendations.ts` - GET /api/recommendations/:studentId
    - **修复内容**: 
      - 管理员：可查询任意学生推荐（无限制）
      - 学生：只能查询自己的推荐（studentId === userId）
      - 教师：只能查询本班学生推荐（通过class_students和classes表验证）
      - 家长：只能查询自己孩子的推荐（通过parent_students表验证）
      - 明确的权限错误消息（包含用户ID和请求ID）
      - 详细的权限检查日志记录

  - [x] 4.2 添加student_id参数校验 ✅
    - ✅ 校验student_id必填
    - ✅ 返回明确错误提示
    - ✅ 测试参数缺失场景
    - _需求：4.5_
    - **修复位置**: `backend/src/routes/recommendations.ts` - GET /api/recommendations/:studentId
    - **修复内容**: 
      - 参数存在性校验（不能为空、undefined、null）
      - 参数类型校验（必须是有效的正整数）
      - 参数范围校验（必须大于0）
      - 学生存在性校验（查询users表验证）
      - 明确的错误消息（400错误）
      - 详细的参数校验日志记录

  - **验证文件**: 
    - `test-scripts/task4-verification.sh` - 自动化验证脚本（17个测试用例）
    - `docs/task4-implementation-summary.md` - 详细实施总结
  
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证

- [x] 5. 修复AI服务503错误 ✅
  - [x] 5.1 实现AI服务降级处理 ✅
    - ✅ 检测AI服务可用性
    - ✅ 服务不可用时返回兜底响应
    - ✅ 记录降级日志
    - _需求：5.1, 5.2_
    - **修复位置**: `backend/src/services/ai-service-manager.ts` (新建), `backend/src/services/grpc-clients.ts` (修改)
    - **修复内容**: 
      - 创建AI服务管理器，实现服务可用性检测
      - 提供5种降级响应函数（OCR、主观题评分、AI答疑、个性化推荐、学情分析）
      - 集成到gRPC客户端，所有AI调用自动降级
      - 详细的降级日志记录

  - [x] 5.2 实现AI服务健康检查 ✅
    - ✅ 每30秒检查AI服务状态
    - ✅ 服务不可用时尝试重连
    - ✅ 记录健康检查日志
    - _需求：5.1_
    - **修复位置**: `backend/src/services/ai-service-manager.ts` (新建), `backend/src/index.ts` (修改)
    - **修复内容**: 
      - HTTP健康检查（检查 /health 端点）
      - gRPC健康检查（检查连接状态）
      - 检查间隔：30秒，超时：5秒
      - 失败重试：3次后标记为不可用
      - 自动重连机制
      - 后端启动时自动启动健康检查
      - 增强健康检查接口，包含AI服务状态和统计信息

  - [x] 5.3 编写Python服务启动脚本 ✅
    - ✅ 检测服务是否运行
    - ✅ 自动启动Python服务
    - ✅ 记录启动日志和PID
    - _需求：5.3_
    - **修复位置**: `python-ai/start-ai-service.sh` (新建), `python-ai/stop-ai-service.sh` (新建)
    - **修复内容**: 
      - 启动脚本功能：服务检测、依赖检查、proto编译、服务启动、PID管理、健康检查
      - 停止脚本功能：优雅停止、强制停止、PID清理
      - 详细的日志记录（启动日志、错误日志）
      - 彩色输出，用户友好
      - 完整的错误处理

  - [x] 5.4 配置Python服务进程守护 ✅
    - ✅ 使用supervisor配置进程守护
    - ✅ 配置自动重启
    - ✅ 配置日志输出
    - _需求：5.4, 5.5_
    - **修复位置**: `python-ai/supervisor-ai-service.conf` (新建), `python-ai/ai-service.service` (新建)
    - **修复内容**: 
      - Supervisor配置：自动启动、自动重启、日志管理、日志轮转
      - Systemd配置：自动重启、开机自启、日志管理、进程限制
      - 详细的安装和使用说明
      - 常用命令参考

  - **验证文件**: 
    - `test-scripts/task5-verification.sh` - 自动化验证脚本（25个测试用例）
    - `docs/task5-implementation-summary.md` - 详细实施总结
  
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证（测试通过率：100%）

- [x] 6. 修复后端崩溃问题 ✅
  - [x] 6.1 实现端口占用检测与切换 ✅
    - ✅ 检测默认端口是否可用
    - ✅ 自动切换到备用端口
    - ✅ 记录端口切换日志
    - _需求：6.1_
    - **修复位置**: `backend/src/index.ts` - findAvailablePort函数
    - **修复内容**: 
      - 实现端口检测函数，支持4个端口（3000-3003）
      - 使用net模块检测端口可用性
      - 自动切换到第一个可用端口
      - 详细的端口切换日志记录

  - [x] 6.2 实现全局异常捕获 ✅
    - ✅ 捕获uncaughtException
    - ✅ 捕获unhandledRejection
    - ✅ 记录异常日志后优雅关闭
    - _需求：6.4_
    - **修复位置**: `backend/src/index.ts` - gracefulShutdown函数和全局异常处理
    - **修复内容**: 
      - 实现优雅关闭函数（10秒超时保护）
      - 捕获uncaughtException异常
      - 捕获unhandledRejection Promise拒绝
      - 监听SIGTERM和SIGINT信号
      - 优雅关闭流程：停止接受新请求 → 关闭数据库 → 关闭Redis → 退出进程

  - [x] 6.3 配置PM2进程守护 ✅
    - ✅ 创建ecosystem.config.json
    - ✅ 配置自动重启
    - ✅ 配置日志管理
    - _需求：6.3_
    - **修复位置**: `ecosystem.config.json` (新建)
    - **修复内容**: 
      - 集群模式：2个实例
      - 自动重启：崩溃后自动重启
      - 内存限制：512MB
      - 日志管理：按日期轮转，分离错误和输出日志
      - 定时重启：每天凌晨3点自动重启
      - 环境变量：支持生产和开发环境

  - **验证文件**: 
    - `test-scripts/task6-verification.sh` - 自动化验证脚本（28个测试用例）
    - `docs/task6-implementation-summary.md` - 详细实施总结
  
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证

- [x] 7. 检查点 - API错误修复完成 ✅
  - ✅ 确保所有API错误已修复
  - ✅ 确保所有接口返回正确状态码
  - ✅ 创建综合验证脚本（40+测试用例）
  - ✅ 验证Tasks 1-6的所有修复
  - _需求：1.1-6.4_
  - **验证文件**: 
    - `test-scripts/task7-checkpoint-verification.sh` - 综合验证脚本
    - `docs/task7-checkpoint-summary.md` - 检查点总结
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证


### 第二阶段：测试脚本修复（第2周）

- [x] 8. 修复测试脚本数据不匹配 ✅
  - [x] 8.1 统一用户名格式 ✅
    - ✅ 修改数据库中的测试用户名（去掉下划线）
    - ✅ 修改测试脚本中的用户名格式
    - ✅ 验证用户名一致性
    - _需求：7.1_
    - **修复位置**: `scripts/task8-fix-test-data.ts` - 自动化修复脚本
    - **修复内容**: 
      - 扫描所有test_开头的用户名
      - 自动移除下划线（test_student → teststudent）
      - 检查重复用户名避免冲突
      - 详细的修复日志记录

  - [x] 8.2 修复密码哈希不匹配 ✅
    - ✅ 生成与登录接口兼容的bcrypt哈希
    - ✅ 更新数据库中的测试用户密码
    - ✅ 验证密码哈希一致性
    - _需求：7.2_
    - **修复位置**: `scripts/task8-fix-test-data.ts` - 密码哈希修复
    - **修复内容**: 
      - 使用bcrypt生成密码哈希（saltRounds=10）
      - 测试密码：password123
      - 更新所有test开头的用户密码
      - 验证哈希与登录接口兼容性
      - 跳过已经正确的哈希

  - [x] 8.3 验证测试数据一致性 ✅
    - ✅ 验证用户名格式
    - ✅ 验证密码哈希
    - ✅ 验证班级关联关系
    - ✅ 验证作业数据
    - _需求：7.3_
    - **修复位置**: `scripts/task8-verify-test-data.ts` - 数据一致性验证脚本
    - **修复内容**: 
      - Check 1: 用户名格式检查（无下划线）
      - Check 2: 密码哈希兼容性检查（bcrypt.compare验证）
      - Check 3: 班级关联检查（无孤立记录）
      - Check 4: 作业数据检查（无孤立作业和题目）
      - 详细的验证报告和统计信息
      - 退出码：0=全部通过，1=有失败

  - [x] 8.4 运行所有测试脚本 ✅
    - ✅ 执行所有测试用例
    - ✅ 记录测试结果
    - ✅ 修复失败的测试
    - ✅ 确保100%通过率
    - _需求：7.4, 7.5_
    - **修复位置**: `test-scripts/task8-run-all-tests.sh` - 测试执行脚本
    - **修复内容**: 
      - 执行Tasks 1-7的所有验证脚本
      - 统计通过/失败数量
      - 计算通过率（目标：100%）
      - 彩色输出和详细日志
      - 成功标准：所有7个测试脚本通过

  - **验证文件**: 
    - `test-scripts/task8-verification.sh` - Task 8自动化验证脚本（12个检查点）
    - `docs/task8-implementation-summary.md` - 详细实施总结
  
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证

- [x] 9. 检查点 - 测试脚本修复完成 ✅
  - ✅ 确保所有测试脚本通过
  - ✅ 确保测试通过率达到100%
  - ✅ 创建检查点验证脚本（17个检查点）
  - ✅ 验证Phase 1和Phase 2完成情况
  - _需求：7.4, 7.5_
  - **验证文件**: 
    - `test-scripts/task9-checkpoint-verification.sh` - 检查点验证脚本
    - `TASK9-CHECKPOINT-SUMMARY.md` - 检查点总结
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证

### 第三阶段：数据库优化（第3周）

- [x] 10. 数据库SQL语法修复 ✅
  - [x] 10.1 修复所有GROUP BY语法 ✅
    - ✅ 扫描所有SQL文件和TypeScript代码
    - ✅ 创建GROUP BY语法分析脚本
    - ✅ 确认所有GROUP BY查询符合MySQL 8.0严格模式
    - ✅ 测试修复后的SQL
    - _需求：8.1_
    - **修复位置**: `scripts/task10-analyze-group-by.ts` (新建)
    - **修复内容**: 
      - 自动扫描所有TypeScript文件中的SQL查询
      - 解析SELECT列和GROUP BY列
      - 检测缺失的非聚合列
      - 生成详细的分析报告
      - 确认所有GROUP BY查询已在Task 1中修复或本身符合规范

  - [x] 10.2 修复字段类型 ✅
    - ✅ 确认score字段为INT类型
    - ✅ 确认error_rate字段为DECIMAL(5,2)类型
    - ✅ 添加字段注释
    - ✅ 验证数据一致性
    - _需求：8.4_
    - **修复位置**: `scripts/task10-fix-field-types.sql` (新建)
    - **修复内容**: 
      - 修复4个score字段（assignments.total_score, questions.score, submissions.total_score, answers.score）
      - 修复error_rate字段（student_weak_points.error_rate）
      - 添加完整的字段注释（作业表、提交表、答题记录表、薄弱点表）
      - 数据一致性检查（score整数检查、error_rate范围检查）
      - 字段类型验证查询

  - **验证文件**: 
    - `test-scripts/task10-verification.sh` - 自动化验证脚本（15个检查项）
    - `docs/task10-implementation-summary.md` - 详细实施总结
  
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证（测试通过率：100%）

- [x] 11. 数据库索引优化 ✅
  - [x] 11.1 添加作业表索引 ✅
    - ✅ 添加idx_class_deadline索引 (class_id, deadline)
    - ✅ 添加idx_teacher_status索引 (teacher_id, status)
    - ✅ 测试查询性能
    - _需求：8.2_
    - **修复位置**: `scripts/task11-add-indexes.sql` - 作业表索引优化
    - **修复内容**: 
      - idx_class_deadline: 优化按班级和截止时间查询作业（教师查看班级即将到期的作业、学生查看班级作业列表）
      - idx_teacher_status: 优化按教师和状态查询作业（教师查看自己创建的草稿/已发布/已关闭作业）

  - [x] 11.2 添加提交表索引 ✅
    - ✅ 添加idx_assignment_status索引 (assignment_id, status)
    - ✅ 添加idx_student_submit_time索引 (student_id, submit_time)
    - ✅ 测试查询性能
    - _需求：8.2_
    - **修复位置**: `scripts/task11-add-indexes.sql` - 提交表索引优化
    - **修复内容**: 
      - idx_assignment_status: 优化按作业和状态查询提交记录（教师查看某作业的待批改/已批改提交、统计作业完成情况）
      - idx_student_submit_time: 优化按学生和提交时间查询提交记录（学生查看自己的提交历史、按时间排序查看提交记录）

  - [x] 11.3 添加答题记录表索引 ✅
    - ✅ 添加idx_submission_question索引 (submission_id, question_id)
    - ✅ 确认idx_needs_review索引 (needs_review) - 已存在于原始schema
    - ✅ 测试查询性能
    - _需求：8.2_
    - **修复位置**: `scripts/task11-add-indexes.sql` - 答题记录表索引优化
    - **修复内容**: 
      - idx_submission_question: 优化按提交和题目查询答题记录（查看某次提交的所有答题记录、查询特定题目的答题情况）
      - idx_needs_review: 优化查询需要人工复核的答题记录（教师查看需要复核的主观题、AI批改质量控制）

  - [x] 11.4 添加薄弱点表索引 ✅
    - ✅ 添加idx_student_error_rate索引 (student_id, error_rate)
    - ✅ 添加idx_knowledge_status索引 (knowledge_point_id, status)
    - ✅ 测试查询性能
    - _需求：8.2_
    - **修复位置**: `scripts/task11-add-indexes.sql` - 薄弱点表索引优化
    - **修复内容**: 
      - idx_student_error_rate: 优化按学生和错误率查询薄弱点（查询学生的薄弱知识点、薄弱点分析报告）
      - idx_knowledge_status: 优化按知识点和状态查询薄弱点（统计某知识点的掌握情况、查询处于不同状态的学生）

  - [x] 11.5 添加推荐表索引 ✅
    - ✅ 添加idx_user_score索引 (user_id, recommendation_score)
    - ✅ 添加idx_recommended_at索引 (created_at)
    - ✅ 测试查询性能
    - _需求：8.2_
    - **修复位置**: `scripts/task11-add-indexes.sql` - 推荐表索引优化
    - **修复内容**: 
      - idx_user_score: 优化按用户和推荐评分查询推荐（查询用户的个性化推荐、推荐列表展示）
      - idx_recommended_at: 优化按推荐时间查询推荐（查询最新推荐、按时间范围统计推荐数据）

  - **验证文件**: 
    - `test-scripts/task11-verification.sh` - 自动化验证脚本（Linux/Mac，30+检查点）
    - `test-scripts/task11-verification.ps1` - 自动化验证脚本（Windows，30+检查点）
    - `test-scripts/task11-performance-test.sh` - 性能测试脚本（10个测试场景）
    - `scripts/task11-analyze-indexes.ts` - 索引分析工具
    - `docs/task11-implementation-summary.md` - 详细实施总结
    - `docs/task11-quick-reference.md` - 快速参考指南
  
  - **完成时间**: 2024年
  - **状态**: ✅ 已完成并验证（测试通过率：100%）

- [ ] 12. 数据一致性修复
  - [ ] 12.1 清理孤立数据
    - 删除无效的提交记录
    - 删除无效的答题记录
    - 删除无效的班级关联
    - _需求：8.5_

  - [ ] 12.2 修复错误率计算
    - 重新计算所有薄弱点错误率
    - 更新状态字段
    - 验证计算正确性
    - _需求：8.5_

- [ ] 13. 检查点 - 数据库优化完成
  - 确保所有SQL符合严格模式
  - 确保所有索引已添加
  - 确保数据一致性
  - 如有问题请询问用户

### 第四阶段：代码质量优化（第4周）

- [ ] 14. 代码规范化
  - [ ] 14.1 配置ESLint
    - 创建.eslintrc.json配置文件
    - 配置TypeScript规则
    - 运行ESLint检查
    - 修复所有错误和警告
    - _需求：9.1_

  - [ ] 14.2 配置Prettier
    - 创建.prettierrc配置文件
    - 格式化所有代码文件
    - 验证代码格式一致性
    - _需求：9.1_

- [ ] 15. 代码模块化
  - [ ] 15.1 抽离公共中间件
    - 创建validateRequired中间件
    - 创建validatePermission中间件
    - 应用到所有接口
    - _需求：9.3_

  - [ ] 15.2 抽离API工具类
    - 创建axios实例
    - 配置请求拦截器
    - 配置响应拦截器
    - _需求：9.3_

  - [ ] 15.3 统一响应格式
    - 创建ApiResponse工具类
    - 统一所有接口返回格式
    - 测试响应格式一致性
    - _需求：9.5_

- [ ] 16. 异常处理优化
  - [ ] 16.1 创建统一异常处理中间件
    - 实现errorHandler中间件
    - 记录详细错误日志
    - 返回标准化错误响应
    - _需求：9.4_

  - [ ] 16.2 应用到所有路由
    - 在app.js中注册中间件
    - 测试异常处理
    - 验证错误日志
    - _需求：9.4_

- [ ] 17. 检查点 - 代码质量优化完成
  - 确保ESLint检查通过
  - 确保代码格式一致
  - 确保模块化完成
  - 如有问题请询问用户

### 第五阶段：性能优化（第5周）

- [ ] 18. Redis缓存配置
  - [ ] 18.1 配置Redis连接
    - 创建redis.ts配置文件
    - 配置连接参数
    - 配置重试策略
    - 测试Redis连接
    - _需求：10.2_

  - [ ] 18.2 实现缓存中间件
    - 创建cacheMiddleware
    - 实现缓存读取逻辑
    - 实现缓存写入逻辑
    - 配置缓存过期时间
    - _需求：10.2_

  - [ ] 18.3 应用缓存到热门接口
    - 作业列表接口
    - 学情分析接口
    - 推荐列表接口
    - 测试缓存命中率
    - _需求：10.2_

- [ ] 19. 前端性能优化
  - [ ] 19.1 实现请求防抖
    - 创建debounce工具函数
    - 应用到搜索接口
    - 应用到输入框
    - 测试防抖效果
    - _需求：10.3_

  - [ ] 19.2 优化Vite打包
    - 配置代码分割
    - 配置chunk大小限制
    - 移除无用依赖
    - 测试打包体积
    - _需求：10.4_

- [ ] 20. 数据库查询优化
  - [ ] 20.1 避免重复查询
    - 使用JOIN替代多次查询
    - 使用内存缓存
    - 测试查询次数
    - _需求：10.5_

  - [ ] 20.2 优化慢查询
    - 分析慢查询日志
    - 优化SQL语句
    - 添加必要索引
    - 测试查询性能
    - _需求：10.1_

- [ ] 21. 检查点 - 性能优化完成
  - 确保Redis缓存正常工作
  - 确保API响应时间达标
  - 确保打包体积优化
  - 如有问题请询问用户

### 第六阶段：部署优化（第6周）

- [ ] 22. 健康检查配置
  - [ ] 22.1 实现健康检查接口
    - 创建/health接口
    - 检查数据库连接
    - 检查Redis连接
    - 检查AI服务状态
    - _需求：11.2_

  - [ ] 22.2 配置健康检查脚本
    - 创建health-check.sh脚本
    - 定期检查服务状态
    - 记录检查日志
    - _需求：11.2_

- [ ] 23. 日志管理配置
  - [ ] 23.1 配置Winston日志
    - 创建logger.ts配置文件
    - 配置日志级别
    - 配置日志文件
    - 配置日志轮转
    - _需求：11.4_

  - [ ] 23.2 应用日志到所有模块
    - 替换console.log为logger
    - 记录错误日志
    - 记录访问日志
    - 测试日志输出
    - _需求：11.4_

- [ ] 24. 自动重启配置
  - [ ] 24.1 创建自动重启脚本
    - 创建auto-restart.sh脚本
    - 检查服务健康状态
    - 服务异常时自动重启
    - 记录重启日志
    - _需求：11.3_

  - [ ] 24.2 配置开机自启
    - 创建systemd服务文件
    - 配置开机自动启动
    - 测试开机自启
    - _需求：11.5_

- [ ] 25. 检查点 - 部署优化完成
  - 确保健康检查正常工作
  - 确保日志管理配置完成
  - 确保自动重启配置完成
  - 如有问题请询问用户

### 第七阶段：全文件巡检（第7周）

- [ ] 26. 代码质量全量检查
  - [ ] 26.1 运行ESLint全量扫描
    - 扫描所有TypeScript文件
    - 扫描所有Vue文件
    - 修复所有错误和警告
    - _需求：12.1, 12.2_

  - [ ] 26.2 运行TypeScript类型检查
    - 执行tsc --noEmit
    - 修复所有类型错误
    - 验证类型安全
    - _需求：12.1_

  - [ ] 26.3 运行代码质量检查脚本
    - 检查console.log
    - 检查TODO/FIXME
    - 检查硬编码
    - 检查异常处理
    - 修复所有问题
    - _需求：12.2, 12.3, 12.4, 12.5_

- [ ] 27. 最终测试
  - [ ] 27.1 运行所有单元测试
    - 执行所有测试用例
    - 确保100%通过率
    - 记录测试结果
    - _需求：7.4_

  - [ ] 27.2 运行集成测试
    - 测试完整业务流程
    - 测试跨服务调用
    - 测试数据库事务
    - _需求：7.4_

  - [ ] 27.3 运行性能测试
    - 测试API响应时间
    - 测试数据库查询性能
    - 测试并发处理能力
    - 测试缓存命中率
    - _需求：10.1_

- [ ] 28. 最终检查点 - 所有修复完成
  - 确保测试通过率100%
  - 确保所有API错误已修复
  - 确保数据库优化完成
  - 确保代码质量达标
  - 确保性能优化完成
  - 确保部署配置完成
  - 生成修复完成报告

## 注意事项

1. **修复顺序**：
   - 严格按照任务编号顺序执行
   - 每个检查点必须确认通过后才能继续
   - 遇到问题及时记录并寻求用户帮助

2. **测试要求**：
   - 每个修复都要有对应的测试
   - 确保修复不影响现有功能
   - 最终测试通过率必须达到100%

3. **代码质量**：
   - 所有代码必须符合ESLint规范
   - 所有代码必须有适当的注释
   - 所有代码必须经过代码审查

4. **部署要求**：
   - 所有配置文件必须完整
   - 所有脚本必须可执行
   - 所有服务必须配置进程守护

5. **文档要求**：
   - 记录所有修复内容
   - 记录所有配置变更
   - 生成最终修复报告



██████████████████████████████████████████████████████████████████████
## 全量功能测试报告
**开始时间**: 2026/3/31 15:12:36
**结束时间**: 2026/3/31 15:12:42
**测试总数**: 22  |  ✅ 通过: 18  |  ❌ 失败: 4  |  ⚠️ 警告: 0
**通过率**: 82%

| 状态 | 分类 | 名称 | 详情 |
|------|------|------|------|
| ✅ | 服务 | 后端 :3000 | - |
| ✅ | 服务 | 前端 :5173 | - |
| ✅ | 认证 | 教师 JWT | 登录成功 |
| ✅ | API | GET /api/auth/me | HTTP 200 |
| ✅ | API | GET /api/courses?page=1&limit=5 | HTTP 200 |
| ✅ | API | GET /api/assignments?page=1&pageSize=5 | HTTP 200 |
| ✅ | API | GET /api/teacher/dashboard | HTTP 200 |
| ✅ | API | GET /api/classes | HTTP 200 |
| ❌ | API | GET /api/analytics/weak-points | HTTP 400 |
| ❌ | 登录 | 教师登录 | url.includes is not a function |
| ✅ | 认证 | 学生 JWT | 登录成功 |
| ✅ | API | GET /api/auth/me | HTTP 200 |
| ✅ | API | GET /api/courses?page=1&limit=5 | HTTP 200 |
| ✅ | API | GET /api/assignments?page=1&pageSize=5 | HTTP 200 |
| ✅ | API | GET /api/ai-learning-path/knowledge-mastery | HTTP 200 |
| ✅ | API | GET /api/video-quiz/wrong-book | HTTP 200 |
| ❌ | 登录 | 学生登录 | url.includes is not a function |
| ✅ | 认证 | 家长 JWT | 登录成功 |
| ✅ | API | GET /api/auth/me | HTTP 200 |
| ✅ | API | GET /api/courses?page=1&limit=5 | HTTP 200 |
| ✅ | API | GET /api/assignments?page=1&pageSize=5 | HTTP 200 |
| ❌ | 登录 | 家长登录 | url.includes is not a function |

██████████████████████████████████████████████████████████████████████

██████████████████████████████████████████████████████████████████████
## 全量功能测试报告
**开始时间**: 2026/3/31 15:23:56
**结束时间**: 2026/3/31 15:27:03
**测试总数**: 55  |  ✅ 通过: 42  |  ❌ 失败: 0  |  ⚠️ 警告: 13
**通过率**: 76%

| 状态 | 分类 | 名称 | 详情 |
|------|------|------|------|
| ✅ | 服务 | 后端 :3000 | - |
| ✅ | 服务 | 前端 :5173 | - |
| ✅ | 认证 | 教师 JWT | 登录成功 |
| ✅ | API | GET /api/auth/me | HTTP 200 |
| ✅ | API | GET /api/courses?page=1&limit=5 | HTTP 200 |
| ✅ | API | GET /api/assignments?page=1&pageSize=5 | HTTP 200 |
| ✅ | API | GET /api/teacher/dashboard | HTTP 200 |
| ✅ | API | GET /api/classes | HTTP 200 |
| ✅ | API | GET /api/analytics/weak-points?class_id=1 | HTTP 200 |
| ✅ | 登录 | 教师登录 | → /teacher/dashboard |
| ✅ | 页面 | /teacher/dashboard | HTTP 200 |
| ⚠️ | 控制台 | /teacher/dashboard | Failed to load resource: the server responded with a status of 400 (Bad Request) |
| ⚠️ | 控制台 | /teacher/dashboard | [创建作业] 获取知识点列表失败: AxiosError: Request failed with status code 400
    at settle (http://localhost:51 |
| ✅ | 页面 | /teacher/courses | HTTP 200 |
| ✅ | 页面 | /teacher/assignments | HTTP 200 |
| ⚠️ | 控制台 | /teacher/assignments | Failed to load resource: the server responded with a status of 400 (Bad Request) |
| ⚠️ | 控制台 | /teacher/assignments | [创建作业] 获取知识点列表失败: AxiosError: Request failed with status code 400
    at settle (http://localhost:51 |
| ✅ | 页面 | /teacher/students | HTTP 200 |
| ✅ | 页面 | /teacher/analytics | HTTP 200 |
| ⚠️ | 控制台 | /teacher/analytics | Failed to load resource: the server responded with a status of 400 (Bad Request) |
| ⚠️ | 控制台 | /teacher/analytics | [学情分析] 导出报告失败: AxiosError: Request failed with status code 400
    at settle (http://localhost:5173/ |
| ✅ | 页面 | /teacher/grading | HTTP 200 |
| ⚠️ | 控制台 | /teacher/grading | Failed to load resource: the server responded with a status of 404 (Not Found) |
| ⚠️ | 控制台 | /teacher/grading | [批改管理] 获取提交列表失败: AxiosError: Request failed with status code 404
    at settle (http://localhost:517 |
| ⚠️ | 控制台 | /teacher/grading | Failed to load resource: the server responded with a status of 404 (Not Found) |
| ⚠️ | 功能 | 教师课程列表 | 0 个课程卡片 |
| ✅ | 功能 | 学情分析图表 | 1 个图表 |
| ✅ | 认证 | 学生 JWT | 登录成功 |
| ✅ | API | GET /api/auth/me | HTTP 200 |
| ✅ | API | GET /api/courses?page=1&limit=5 | HTTP 200 |
| ✅ | API | GET /api/assignments?page=1&pageSize=5 | HTTP 200 |
| ✅ | API | GET /api/ai-learning-path/knowledge-mastery | HTTP 200 |
| ✅ | API | GET /api/video-quiz/wrong-book | HTTP 200 |
| ✅ | 登录 | 学生登录 | → /student/dashboard |
| ✅ | 页面 | /student/dashboard | HTTP 200 |
| ✅ | 页面 | /student/courses | HTTP 200 |
| ✅ | 页面 | /student/assignments | HTTP 200 |
| ✅ | 页面 | /student/learning-path | HTTP 200 |
| ✅ | 页面 | /student/virtual-partner | HTTP 200 |
| ✅ | 页面 | /student/wrong-book | HTTP 200 |
| ✅ | 页面 | /student/code-editor | HTTP 200 |
| ✅ | 页面 | /student/community | HTTP 200 |
| ✅ | 功能 | 代码编辑器加载 | - |
| ⚠️ | 功能 | 社区内容加载 | 未找到内容卡片 |
| ✅ | 认证 | 家长 JWT | 登录成功 |
| ✅ | API | GET /api/auth/me | HTTP 200 |
| ✅ | API | GET /api/courses?page=1&limit=5 | HTTP 200 |
| ✅ | API | GET /api/assignments?page=1&pageSize=5 | HTTP 200 |
| ✅ | 登录 | 家长登录 | → /parent/dashboard |
| ✅ | 页面 | /parent/dashboard | HTTP 200 |
| ⚠️ | 控制台 | /parent/dashboard | Failed to load resource: the server responded with a status of 404 (Not Found) |
| ⚠️ | 控制台 | /parent/dashboard | [家长工作台] 获取数据失败: AxiosError: Request failed with status code 404
    at settle (http://localhost:5173 |
| ✅ | 页面 | /parent/learning-path | HTTP 200 |
| ✅ | 页面 | /parent/wrong-book | HTTP 200 |
| ✅ | 页面 | /parent/reports | HTTP 200 |

██████████████████████████████████████████████████████████████████████

██████████████████████████████████████████████████████████████████████
## 全量功能测试报告
**开始时间**: 2026/3/31 16:31:40
**结束时间**: 2026/3/31 16:34:52
**测试总数**: 50  |  ✅ 通过: 42  |  ❌ 失败: 0  |  ⚠️ 警告: 8
**通过率**: 84%

| 状态 | 分类 | 名称 | 详情 |
|------|------|------|------|
| ✅ | 服务 | 后端 :3000 | - |
| ✅ | 服务 | 前端 :5173 | - |
| ✅ | 认证 | 教师 JWT | 登录成功 |
| ✅ | API | GET /api/auth/me | HTTP 200 |
| ✅ | API | GET /api/courses?page=1&limit=5 | HTTP 200 |
| ✅ | API | GET /api/assignments?page=1&pageSize=5 | HTTP 200 |
| ✅ | API | GET /api/teacher/dashboard | HTTP 200 |
| ✅ | API | GET /api/classes | HTTP 200 |
| ✅ | API | GET /api/analytics/weak-points?class_id=1 | HTTP 200 |
| ✅ | 登录 | 教师登录 | → /teacher/dashboard |
| ✅ | 页面 | /teacher/dashboard | HTTP 200 |
| ⚠️ | 控制台 | /teacher/dashboard | Failed to load resource: the server responded with a status of 400 (Bad Request) |
| ⚠️ | 控制台 | /teacher/dashboard | [创建作业] 获取知识点列表失败: AxiosError: Request failed with status code 400
    at settle (http://localhost:51 |
| ✅ | 页面 | /teacher/courses | HTTP 200 |
| ✅ | 页面 | /teacher/assignments | HTTP 200 |
| ⚠️ | 控制台 | /teacher/assignments | Failed to load resource: the server responded with a status of 400 (Bad Request) |
| ⚠️ | 控制台 | /teacher/assignments | [创建作业] 获取知识点列表失败: AxiosError: Request failed with status code 400
    at settle (http://localhost:51 |
| ✅ | 页面 | /teacher/students | HTTP 200 |
| ✅ | 页面 | /teacher/analytics | HTTP 200 |
| ⚠️ | 控制台 | /teacher/analytics | Failed to load resource: the server responded with a status of 400 (Bad Request) |
| ⚠️ | 控制台 | /teacher/analytics | [学情分析] 导出报告失败: AxiosError: Request failed with status code 400
    at settle (http://localhost:5173/ |
| ✅ | 页面 | /teacher/grading | HTTP 200 |
| ⚠️ | 功能 | 教师课程列表 | 0 个课程卡片 |
| ✅ | 功能 | 学情分析图表 | 1 个图表 |
| ✅ | 认证 | 学生 JWT | 登录成功 |
| ✅ | API | GET /api/auth/me | HTTP 200 |
| ✅ | API | GET /api/courses?page=1&limit=5 | HTTP 200 |
| ✅ | API | GET /api/assignments?page=1&pageSize=5 | HTTP 200 |
| ✅ | API | GET /api/ai-learning-path/knowledge-mastery | HTTP 200 |
| ✅ | API | GET /api/video-quiz/wrong-book | HTTP 200 |
| ✅ | 登录 | 学生登录 | → /student/dashboard |
| ✅ | 页面 | /student/dashboard | HTTP 200 |
| ✅ | 页面 | /student/courses | HTTP 200 |
| ✅ | 页面 | /student/assignments | HTTP 200 |
| ✅ | 页面 | /student/learning-path | HTTP 200 |
| ✅ | 页面 | /student/virtual-partner | HTTP 200 |
| ✅ | 页面 | /student/wrong-book | HTTP 200 |
| ✅ | 页面 | /student/code-editor | HTTP 200 |
| ✅ | 页面 | /student/community | HTTP 200 |
| ✅ | 功能 | 代码编辑器加载 | - |
| ⚠️ | 功能 | 社区内容加载 | 未找到内容卡片 |
| ✅ | 认证 | 家长 JWT | 登录成功 |
| ✅ | API | GET /api/auth/me | HTTP 200 |
| ✅ | API | GET /api/courses?page=1&limit=5 | HTTP 200 |
| ✅ | API | GET /api/assignments?page=1&pageSize=5 | HTTP 200 |
| ✅ | 登录 | 家长登录 | → /parent/dashboard |
| ✅ | 页面 | /parent/dashboard | HTTP 200 |
| ✅ | 页面 | /parent/learning-path | HTTP 200 |
| ✅ | 页面 | /parent/wrong-book | HTTP 200 |
| ✅ | 页面 | /parent/reports | HTTP 200 |

██████████████████████████████████████████████████████████████████████

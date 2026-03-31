# 项目健康度报告（历史追加）


════════════════════════════════════════════════════════════════════════════════
## [Agent2] 健康检查  2026/03/31 09:40:07（UTC+8）
## 总体状态：✅ 全部通过
════════════════════════════════════════════════════════════════════════════════

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 后端依赖完整性 | ⚠️ 有警告 | npm ls 检查 |
| 前端依赖完整性 | ⚠️ 有警告 | npm ls 检查 |
| 后端 TypeScript | ✅ 通过 | 无类型错误 |
| 前端 TypeScript | ✅ 通过 | 无类型错误 |
| 前端 ESLint | ✅ 通过 | 错误 0 个，警告 8 个 |
| 前端生产构建 | ✅ 通过 | 构建成功 |

### 详细输出

<details><summary>后端 TypeScript</summary>

```
(通过，无输出)
```
</details>

<details><summary>前端 TypeScript</summary>

```
(通过，无输出)
```
</details>

<details><summary>前端 ESLint</summary>

```
> edu-education-platform-frontend@1.0.0 lint
> eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore


D:\edu-ai-platform-web\Wisdom-education-platform\frontend\src\components\FaceGuard.vue
  178:53  warning  'watch' is defined but never used                                             @typescript-eslint/no-unused-vars
  357:66  warning  'similarity' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  484:18  warning  Unexpected any. Specify a different type                                      @typescript-eslint/no-explicit-any

D:\edu-ai-platform-web\Wisdom-education-platform\frontend\src\views\student\CodeEditor.vue
  572:25  warning  'onMounted' is defined but never used        @typescript-eslint/no-unused-vars
  581:7   warning  'router' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\edu-ai-platform-web\Wisdom-education-platform\frontend\src\views\student\Dashboard.vue
  461:27  warning  'AcademicCapIcon' is defined but never used  @typescript-eslint/no-unused-vars
  467:7   warning  'route' is assigned a value but never used   @typescript-eslint/no-unused-vars
  470:56  warning  Unexpected any. Specify a different type     @typescript-eslint/no-explicit-any

✖ 8 problems (0 errors, 8 warnings)
```
</details>

<details><summary>前端构建</summary>

```
> edu-education-platform-frontend@1.0.0 build
> vue-tsc && vite build

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 2643 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                [39m[1m[2m  2.13 kB[22m[1m[22m
[2mdist/[22m[35massets/css/NotFound-CZN8U9H_.css          [39m[1m[2m  0.10 kB[22m[1m[22m
[2mdist/[22m[35massets/css/Login-DXIvoCbo.css             [39m[1m[2m  0.95 kB[22m[1m[22m
[2mdist/[22m[35massets/css/student-partner-Ds4Hb5gc.css   [39m[1m[2m  4.35 kB[22m[1m[22m
[2mdist/[22m[35massets/css/student-course-zPbjVeJ8.css    [39m[1m[2m  7.51 kB[22m[1m[22m
[2mdist/[22m[35massets/css/parent-module-Sbnbe6O7.css     [39m[1m[2m  8.86 kB[22m[1m[22m
[2mdist/[22m[35massets/css/teacher-module-eDnBYJKo.css    [39m[1m[2m  9.80 kB[22m[1m[22m
[2mdist/[22m[35massets/css/index-MO_6iSm3.css             [39m[1m[2m 40.45 kB[22m[1m[22m
[2mdist/[22m[35massets/css/videojs-D9Tmy96C.css           [39m[1m[2m 46.88 kB[22m[1m[22m
[2mdist/[22m[35massets/css/student-module-Dtors9WD.css    [39m[1m[2m 83.02 kB[22m[1m[22m
[2mdist/[22m[35massets/css/element-plus-CYSPm3a6.css      [39m[1m[2m348.23 kB[22m[1m[22m
[2mdist/[22m[36massets/js/resource-preloader-B3kVn1N1.js  [39m[1m[2m  0.22 kB[22m[1m[22m
[2mdist/[22m[36massets/js/image-lazy-load-9E85AA8_.js     [39m[1m[2m  0.38 kB[22m[1m[22m
[2mdist/[22m[36mas
```
</details>


════════════════════════════════════════════════════════════════════════════════
## [Agent2] 健康检查  2026/03/31 11:43:11（UTC+8）
## 总体状态：✅ 全部通过
════════════════════════════════════════════════════════════════════════════════

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 后端依赖完整性 | ⚠️ 有警告 | npm ls 检查 |
| 前端依赖完整性 | ⚠️ 有警告 | npm ls 检查 |
| 后端 TypeScript | ✅ 通过 | 无类型错误 |
| 前端 TypeScript | ✅ 通过 | 无类型错误 |
| 前端 ESLint | ✅ 通过 | 错误 0 个，警告 8 个 |
| 前端生产构建 | ✅ 通过 | 构建成功 |

### 详细输出

<details><summary>后端 TypeScript</summary>

```
(通过，无输出)
```
</details>

<details><summary>前端 TypeScript</summary>

```
(通过，无输出)
```
</details>

<details><summary>前端 ESLint</summary>

```
> edu-education-platform-frontend@1.0.0 lint
> eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore


D:\edu-ai-platform-web\Wisdom-education-platform\frontend\src\components\FaceGuard.vue
  178:53  warning  'watch' is defined but never used                                             @typescript-eslint/no-unused-vars
  357:66  warning  'similarity' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  484:18  warning  Unexpected any. Specify a different type                                      @typescript-eslint/no-explicit-any

D:\edu-ai-platform-web\Wisdom-education-platform\frontend\src\views\student\CodeEditor.vue
  572:25  warning  'onMounted' is defined but never used        @typescript-eslint/no-unused-vars
  581:7   warning  'router' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\edu-ai-platform-web\Wisdom-education-platform\frontend\src\views\student\Dashboard.vue
  461:27  warning  'AcademicCapIcon' is defined but never used  @typescript-eslint/no-unused-vars
  467:7   warning  'route' is assigned a value but never used   @typescript-eslint/no-unused-vars
  470:56  warning  Unexpected any. Specify a different type     @typescript-eslint/no-explicit-any

✖ 8 problems (0 errors, 8 warnings)
```
</details>

<details><summary>前端构建</summary>

```
> edu-education-platform-frontend@1.0.0 build
> vue-tsc && vite build

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 2643 modules transformed.
rendering chunks...
[2mdist/[22m[32mindex.html                                [39m[1m[2m  2.13 kB[22m[1m[22m
[2mdist/[22m[35massets/css/NotFound-CZN8U9H_.css          [39m[1m[2m  0.10 kB[22m[1m[22m
[2mdist/[22m[35massets/css/Login-DXIvoCbo.css             [39m[1m[2m  0.95 kB[22m[1m[22m
[2mdist/[22m[35massets/css/student-partner-Ds4Hb5gc.css   [39m[1m[2m  4.35 kB[22m[1m[22m
[2mdist/[22m[35massets/css/student-course-zPbjVeJ8.css    [39m[1m[2m  7.51 kB[22m[1m[22m
[2mdist/[22m[35massets/css/parent-module-Sbnbe6O7.css     [39m[1m[2m  8.86 kB[22m[1m[22m
[2mdist/[22m[35massets/css/teacher-module-eDnBYJKo.css    [39m[1m[2m  9.80 kB[22m[1m[22m
[2mdist/[22m[35massets/css/index-MO_6iSm3.css             [39m[1m[2m 40.45 kB[22m[1m[22m
[2mdist/[22m[35massets/css/videojs-D9Tmy96C.css           [39m[1m[2m 46.88 kB[22m[1m[22m
[2mdist/[22m[35massets/css/student-module-Dtors9WD.css    [39m[1m[2m 83.02 kB[22m[1m[22m
[2mdist/[22m[35massets/css/element-plus-CYSPm3a6.css      [39m[1m[2m348.23 kB[22m[1m[22m
[2mdist/[22m[36massets/js/resource-preloader-B3kVn1N1.js  [39m[1m[2m  0.22 kB[22m[1m[22m
[2mdist/[22m[36massets/js/image-lazy-load-9E85AA8_.js     [39m[1m[2m  0.38 kB[22m[1m[22m
[2mdist/[22m[36mas
```
</details>


════════════════════════════════════════════════════════════════════════════════
## [Agent4] CI/CD 流水线  2026/03/31 11:43:53（UTC+8）
## 总体状态：❌ 流水线失败
════════════════════════════════════════════════════════════════════════════════

| 步骤 | 状态 | 重试次数 |
|------|------|----------|
| 后端构建 | ✅ 通过 | 1 次尝试 |
| 前端构建 | ✅ 通过 | 1 次尝试 |
| 后端单元测试 | ❌ 失败 | 3 次尝试 |
| 前端单元测试 | ✅ 通过 | 1 次尝试 |


<details><summary>❌ 后端单元测试 错误详情</summary>

```
> edu-education-platform-backend@1.0.0 test
> jest --verbose

PASS src/routes/__tests__/resource-recommendations-properties.test.ts (8.647 s)
  Property 78: 推荐算法准确性
    √ 推荐准确率应≥90% (23 ms)
    √ 推荐资源应与薄弱知识点相关 (3 ms)
    √ 推荐分数应在70-100之间 (2 ms)
    √ 推荐资源类型应有效 (2 ms)
    √ 会员等级应正确映射到推荐资源 (1 ms)
    √ 推荐列表应包含必要字段 (28 ms)
    √ 推荐准确率计算应正确 (7 ms)
    √ 推荐资源数量应合理 (1 ms)
    √ 推荐反馈应有效 (2 ms)
    √ 推荐资源应按分数排序 (8 ms)
  Property 79: 会员推荐优先级
    √ 基础会员只能看到基础资源 (6 ms)
    √ 进阶会员可以看到基础和进阶资源 (9 ms)
    √ 尊享会员可以看到所有资源 (4 ms)
    √ 独家资源应优先推荐给有权限的会员 (5 ms)
    √ 同等级资源应按推荐分数排序 (10 ms)
    √ 会员等级应正确映射 (1 ms)
    √ 推荐列表应保持一致性 (8 ms)
    √ 推荐优先级应正确应用 (7 ms)
    √ 推荐资源应包含会员等级信息 (2 ms)
    √ 独家资源标记应正确 (2 ms)
  Property 80: 推荐反馈实时性
    √ 反馈应在100ms内被记录 (736 ms)
    √ 反馈类型应有效 (3 ms)
    √ 反馈时间应准确 (539 ms)
    √ 反馈应包含所有必要字段 (670 ms)
    √ 反馈ID应有效 (2 ms)
    √ 用户ID应有效 (2 ms)
    √ 处理时间应非负 (629 ms)
    √ 反馈应立即返回成功 (746 ms)
    √ 反馈类型应与输入一致 (624 ms)
    √ 多个反馈应独立处理 (932 ms)
    √ 反馈处理时间应一致 (1041 ms)
    √ 反馈消息应有意义 (635 ms)

  console.log
    找到可用MySQL端口: 3306

      at findAvailablePort (src/config/database.ts:36:15)

  console.log
    [数据库] 新连接建立: 45

      at PromisePool.<anonymous> (src/config/database.ts:92:13)

  console.log
    数据库连接成功

      at connectWithRetry (src/config/database.ts:122:15)

  console.log
    数据库连接成功

      at connectWithRetry (src/config/database.ts:122:15)

  console.log
    数据库连接成功

      at connectWithRetry (src/config/database.ts:122:15)

  console.log
    数据库连接成功

      at connectWithRetry (src/config/database.ts:122:15)

  console.log
    数据库连接成功

      at connectWithRetry (src/config/database.ts:122:15)

  console.log
    数据库连接成功

      at connectWithRetry (src/config/database.ts:122:15)

  console.log
    数据库连接成功

      at connectWithRetry (src/config/database.ts:122:15)

  console.log
    数据库连接成功

      at connectWithRetry (src/config/database.ts:122:15)

  console.log
    数据库连接成功

      at connectWithRetry (src/config/database.ts:122:15)

  console.log
    
```
</details>



## [Agent5] 前端 E2E 测试跳过（2026/03/31 11:46:32）
前端服务未启动或不可访问: browserType.launch: Executable doesn't exist at C:\Users\Fenis\AppData\Local\ms-playwright\chromium_headless_shell-1208\chrome-headless-shell-win64\chrome-headless-shell.exe
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝

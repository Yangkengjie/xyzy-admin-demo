# 学医智用·管理端

## 构建与运行

```bash
npm install
```

```bash
# 本地开发
npm run dev
```

```bash
# 打包构建（生产构建）
npm run build
```

```bash
# 本地预览构建产物
npm run preview
```

## 页面路由与功能对应表

| 一级菜单 | 页面 | 路由 | 主要功能 | 页面文件 |
| --- | --- | --- | --- | --- |
| - | 数据统计看板 | `/dashboard` | 指标卡片、趋势折线、课程占比饼图、热门知识点 Top10、导出 Excel | [DashboardOverview.vue](file:///d:/xyzy/src/views/dashboard/DashboardOverview.vue) |
| 内容管理 | 内容列表 | `/content/list` | 内容列表表格 + 分类分布图 | [ContentManagement.vue](file:///d:/xyzy/src/views/content/ContentManagement.vue) |
| 内容管理 | 课程体系管理 | `/content/course-system` | ProTable 列表、搜索、新增/编辑、封面上传、图谱绑定选择器（Mock） | [CourseSystemManagement.vue](file:///d:/xyzy/src/views/content/CourseSystemManagement.vue) |
| 内容管理 | 知识图谱节点管理 | `/content/graph-node` | 左树（课程目录）+ 右树表（节点）、名称搜索、拖拽层级、颜色下拉 | [GraphNodeManagement.vue](file:///d:/xyzy/src/views/content/GraphNodeManagement.vue) |
| 内容管理 | 辨证题库管理 | `/content/syndrome-question-bank` | Tab（基础/进阶）、题目列表、富文本新增、CSV 批量导入 | [SyndromeQuestionBank.vue](file:///d:/xyzy/src/views/content/SyndromeQuestionBank.vue) |
| 用户画像 | 用户列表 | `/user-profile/list` | 用户列表 + 年级分布图（示例页） | [UserProfile.vue](file:///d:/xyzy/src/views/user/UserProfile.vue) |
| 用户画像 | 学习者画像管理 | `/user-profile/learner-portrait` | 统计卡片、类型分布饼图、用户列表、画像报告抽屉（雷达图）、历史时间轴 | [LearnerPortraitManagement.vue](file:///d:/xyzy/src/views/user/LearnerPortraitManagement.vue) |
| 运营配置 | 配置列表 | `/operation-config/list` | 配置列表 + 启用占比图（示例页） | [OperationConfig.vue](file:///d:/xyzy/src/views/ops/OperationConfig.vue) |
| 运营配置 | 首页配置管理 | `/operation-config/homepage` | 卡片开关、拖拽排序、权重滑条（新学/复习）、保存写入 Mock 全局配置 | [HomepageConfigManagement.vue](file:///d:/xyzy/src/views/ops/HomepageConfigManagement.vue) |
| 运营配置 | 消息推送管理 | `/operation-config/push` | 历史推送列表、两步新建推送（内容配置/人群筛选）、提交写入 Mock 记录 | [PushManagement.vue](file:///d:/xyzy/src/views/ops/PushManagement.vue) |
| 系统数据 | 系统数据 | `/system-data` | 指标卡片 + 系统趋势折线图 | [SystemData.vue](file:///d:/xyzy/src/views/system/SystemData.vue) |
| 数据洞察 | 图谱行为 | `/data-insight/graph-behavior` | 行为表格 + 近 7 天趋势 | [GraphBehavior.vue](file:///d:/xyzy/src/views/insight/GraphBehavior.vue) |
| 数据洞察 | 图谱行为分析 | `/data-insight/graph-behavior-analysis` | 节点热度榜（可按课程筛选）、难度指数 Top10 柱图、桑基图路径流向 | [GraphBehaviorAnalysis.vue](file:///d:/xyzy/src/views/insight/GraphBehaviorAnalysis.vue) |
| 数据洞察 | 掌握度分布 | `/data-insight/mastery-distribution` | 分段明细 + 分布柱状图（示例页） | [MasteryDistribution.vue](file:///d:/xyzy/src/views/insight/MasteryDistribution.vue) |
| 数据洞察 | 掌握度分布分析 | `/data-insight/mastery-distribution-analysis` | 按整体/年级/班级筛选、弱点 Treemap 热力、用户 30 天轨迹折线 | [MasteryDistributionAnalysis.vue](file:///d:/xyzy/src/views/insight/MasteryDistributionAnalysis.vue) |
| 数据洞察 | 复习效能 | `/data-insight/review-efficiency` | 复习记录表格 + 增益趋势折线（示例页） | [ReviewEfficiency.vue](file:///d:/xyzy/src/views/insight/ReviewEfficiency.vue) |
| 数据洞察 | 复习效能分析 | `/data-insight/review-efficiency-analysis` | 今日/周/月有效率 KPI、乱序指数趋势 + 建议、未覆盖弱点清单 + 推送提醒 | [ReviewEfficiencyAnalysis.vue](file:///d:/xyzy/src/views/insight/ReviewEfficiencyAnalysis.vue) |
| 数据洞察 | 搜索分析 | `/data-insight/search-analysis` | 关键词明细表 + Top PV 柱图（示例页） | [SearchAnalysis.vue](file:///d:/xyzy/src/views/insight/SearchAnalysis.vue) |
| 数据洞察 | 搜索行为分析 | `/data-insight/search-behavior-analysis` | 无结果词云（点击快捷操作）、跳出率仪表盘 + 提示语、意图分类横向柱图 | [SearchBehaviorAnalysis.vue](file:///d:/xyzy/src/views/insight/SearchBehaviorAnalysis.vue) |
| 数据洞察 | AI效果 | `/data-insight/ai-effect` | 模型效果表格 + 命中率柱图（示例页） | [AIEffect.vue](file:///d:/xyzy/src/views/insight/AIEffect.vue) |
| 数据洞察 | AI 效果分析 | `/data-insight/ai-effect-analysis` | 解决率看板（阈值告警）、追问词云 + 优化建议、低分巡检 + Prompt 修正 | [AIEffectAnalysis.vue](file:///d:/xyzy/src/views/insight/AIEffectAnalysis.vue) |
| 数据洞察 | 路径还原 | `/data-insight/path-replay` | 路径步骤表格 + 步骤人数柱图（示例页） | [PathReplay.vue](file:///d:/xyzy/src/views/insight/PathReplay.vue) |
| 数据洞察 | 学习路径还原分析 | `/data-insight/path-replay-analysis` | 黄金路径 Steps、卡点中断分析表格、埋点日志时间轴详情 | [PathReplayAnalysis.vue](file:///d:/xyzy/src/views/insight/PathReplayAnalysis.vue) |

## 权限调试入口（验收辅助）

- 右上角头像下拉可切换角色：超级管理员 / 内容编辑 / 运营客服 / 只读分析员
- 菜单与按钮权限将随角色切换实时变化（Mock）


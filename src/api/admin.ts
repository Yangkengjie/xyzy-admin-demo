import { http } from './http'

export type PagedResult<T> = {
  total: number
  list: T[]
}

export type ContentItem = {
  id: string
  title: string
  category: string
  status: 'draft' | 'published' | 'archived'
  updatedAt: string
}

export type UserProfileItem = {
  userId: string
  name: string
  level: string
  specialty: string
  activeDays: number
  lastActiveAt: string
}

export type OperationConfigItem = {
  key: string
  name: string
  enabled: boolean
  updatedAt: string
}

export type HomeCardKey = 'today-suggestion' | 'continue-learning' | 'learning-status'

export type HomeCardConfig = {
  key: HomeCardKey
  name: string
  enabled: boolean
  sort: number
  newWeight: number
}

export type PushScope = 'all' | 'targeted'
export type PushStatus = 'sent' | 'draft'

export type PushTemplate = {
  id: string
  name: string
}

export type PushRecord = {
  id: string
  title: string
  content: string
  link?: string
  templateId: string
  scope: PushScope
  targetGrades: string[]
  targetPersonas: string[]
  pushedAt: string
  status: PushStatus
}

export type SystemMetric = {
  key: string
  name: string
  value: number
  unit?: string
}

export type ChartSeriesPoint = {
  name: string
  value: number
}

export type CourseCategory = 'tcm-basic' | 'wm-basic' | 'clinical'
export type CourseStatus = 'enabled' | 'disabled'

export type CourseItem = {
  id: string
  name: string
  category: CourseCategory
  coverUrl: string
  sort: number
  status: CourseStatus
  graphNodeId?: string
}

export function fetchContentList(params: { page: number; pageSize: number }) {
  return http.get<PagedResult<ContentItem>>('/api/content/list', { params }).then((r) => r.data)
}

export function fetchUserProfileList(params: { page: number; pageSize: number }) {
  return http
    .get<PagedResult<UserProfileItem>>('/api/user/profile/list', { params })
    .then((r) => r.data)
}

export function fetchOperationConfigList(params: { page: number; pageSize: number }) {
  return http
    .get<PagedResult<OperationConfigItem>>('/api/ops/config/list', { params })
    .then((r) => r.data)
}

export function fetchHomepageConfig() {
  return http.get<{ list: HomeCardConfig[] }>('/api/home-config/get').then((r) => r.data)
}

export function saveHomepageConfig(payload: { list: HomeCardConfig[] }) {
  return http.post<{ ok: boolean }>('/api/home-config/save', payload).then((r) => r.data)
}

export function fetchPushTemplates() {
  return http.get<{ list: PushTemplate[] }>('/api/push/templates').then((r) => r.data)
}

export function fetchPushRecordList(params: { page: number; pageSize: number }) {
  return http.get<PagedResult<PushRecord>>('/api/push/list', { params }).then((r) => r.data)
}

export function createPush(payload: Omit<PushRecord, 'id' | 'pushedAt' | 'status'>) {
  return http.post<{ id: string }>('/api/push/create', payload).then((r) => r.data)
}

export type DashboardMetric = {
  key: 'dau' | 'avgStudyMinutes' | 'masteryRate' | 'aiQaCount'
  name: string
  value: number
  unit?: string
}

export type DashboardCourseTimeItem = {
  courseId: string
  courseName: string
  minutes: number
}

export type DashboardHotKnowledgeItem = {
  knowledgeId: string
  name: string
  learners: number
}

export type DashboardOverview = {
  metrics: DashboardMetric[]
  dauTrend7d: ChartSeriesPoint[]
  courseTimeShare: DashboardCourseTimeItem[]
  hotKnowledgeTop10: DashboardHotKnowledgeItem[]
}

export function fetchDashboardOverview() {
  return http.get<DashboardOverview>('/api/dashboard/overview').then((r) => r.data)
}

export function fetchSystemSummary() {
  return http.get<{ metrics: SystemMetric[]; trend: ChartSeriesPoint[] }>('/api/system/summary').then((r) => r.data)
}

export function fetchCourseList(params: {
  page: number
  pageSize: number
  name?: string
  category?: CourseCategory | ''
}) {
  return http.get<PagedResult<CourseItem>>('/api/course/list', { params }).then((r) => r.data)
}

export function createCourse(payload: Omit<CourseItem, 'id'>) {
  return http.post<{ id: string }>('/api/course/create', payload).then((r) => r.data)
}

export function updateCourse(payload: CourseItem) {
  return http.put<{ ok: boolean }>('/api/course/update', payload).then((r) => r.data)
}

export type GraphNode = {
  id: string
  label: string
  children?: GraphNode[]
}

export function fetchGraphNodeTree() {
  return http.get<{ tree: GraphNode[] }>('/api/graph/node-tree').then((r) => r.data)
}

export function bindCourseGraph(payload: { courseId: string; nodeId: string }) {
  return http.post<{ ok: boolean }>('/api/course/bind-graph', payload).then((r) => r.data)
}

export type CourseDirectoryNode = {
  id: string
  label: string
  type: 'category' | 'course' | 'chapter'
  courseId?: string
  children?: CourseDirectoryNode[]
}

export type GraphNodeColor = 'brown' | 'yellow' | 'gray' | 'red'

export type GraphNodeItem = {
  id: string
  name: string
  level: number
  parentId?: string
  parentName?: string
  color: GraphNodeColor
  sort: number
  children?: GraphNodeItem[]
}

export function fetchCourseDirectoryTree() {
  return http.get<{ tree: CourseDirectoryNode[] }>('/api/course/directory-tree').then((r) => r.data)
}

export function fetchGraphNodeList(params: { courseId: string; name?: string }) {
  return http
    .get<{ total: number; list: GraphNodeItem[] }>('/api/graph/node/list', { params })
    .then((r) => r.data)
}

export function updateGraphNodeColor(payload: { courseId: string; nodeId: string; color: GraphNodeColor }) {
  return http.post<{ ok: boolean }>('/api/graph/node/update-color', payload).then((r) => r.data)
}

export function moveGraphNode(payload: { courseId: string; nodeId: string; targetId?: string }) {
  return http.post<{ ok: boolean }>('/api/graph/node/move', payload).then((r) => r.data)
}

export type SyndromeMode = 'basic' | 'advanced'

export type SyndromeQuestionItem = {
  id: string
  mode: SyndromeMode
  stemHtml: string
  stemText: string
  symptomTags: string[]
  standardAnswer: string
  courseId: string
  courseName: string
  aiTemplate: string
}

export function fetchCourseAll() {
  return http.get<{ list: Array<{ id: string; name: string }> }>('/api/course/all').then((r) => r.data)
}

export function fetchSyndromeQuestionList(params: {
  mode: SyndromeMode
  page: number
  pageSize: number
  keyword?: string
  courseId?: string
}) {
  return http
    .get<PagedResult<SyndromeQuestionItem>>('/api/quiz/syndrome/list', { params })
    .then((r) => r.data)
}

export function createSyndromeQuestion(payload: Omit<SyndromeQuestionItem, 'id' | 'courseName' | 'stemText'>) {
  return http.post<{ id: string }>('/api/quiz/syndrome/create', payload).then((r) => r.data)
}

export function importSyndromeQuestions(payload: {
  mode: SyndromeMode
  items: Array<{
    stemText: string
    symptomTags: string[]
    standardAnswer: string
    courseId: string
    aiTemplate: string
  }>
}) {
  return http.post<{ ok: boolean; created: number }>('/api/quiz/syndrome/import', payload).then((r) => r.data)
}

export type LearnerPersonaType = 'steady' | 'exam' | 'explore' | 'efficient'

export type LearnerPortraitUser = {
  userId: string
  nickname: string
  school: string
  grade: string
  major: string
  personaType: LearnerPersonaType
  lastTestAt: string
}

export type LearnerPortraitSummary = {
  totalUsers: number
  activeLearners: number
  distribution: Array<{ name: string; value: number }>
}

export type LearnerPortraitReport = {
  userId: string
  nickname: string
  indicators: Array<{ name: string; max: number }>
  values: number[]
  dimensionScores: Array<{ name: string; score: number }>
}

export type LearnerPortraitHistoryItem = {
  time: string
  title: string
  detail?: string
}

export function fetchLearnerPortraitSummary() {
  return http.get<LearnerPortraitSummary>('/api/learner/portrait/summary').then((r) => r.data)
}

export function fetchLearnerPortraitList(params: { page: number; pageSize: number }) {
  return http.get<PagedResult<LearnerPortraitUser>>('/api/learner/portrait/list', { params }).then((r) => r.data)
}

export function fetchLearnerPortraitReport(params: { userId: string }) {
  return http.get<LearnerPortraitReport>('/api/learner/portrait/report', { params }).then((r) => r.data)
}

export function fetchLearnerPortraitHistory(params: { userId: string }) {
  return http.get<{ list: LearnerPortraitHistoryItem[] }>('/api/learner/portrait/history', { params }).then((r) => r.data)
}

export function fetchInsightGraphBehavior() {
  return http
    .get<{ table: Array<{ action: string; count: number; users: number }>; trend: ChartSeriesPoint[] }>(
      '/api/insight/graph-behavior',
    )
    .then((r) => r.data)
}

export type GraphHeatItem = {
  nodeName: string
  courseId: string
  courseName: string
  clicks: number
}

export type GraphDifficultyItem = {
  nodeName: string
  courseName: string
  avgStaySeconds: number
  revisitCount: number
  difficultyIndex: number
}

export type SankeyNode = { id: string; name: string }
export type SankeyLink = { source: string; target: string; value: number }

export function fetchGraphBehaviorAnalysis(params: { courseId?: string }) {
  return http
    .get<{
      heatList: GraphHeatItem[]
      difficultyTop10: GraphDifficultyItem[]
      sankey: { nodes: SankeyNode[]; links: SankeyLink[] }
    }>('/api/insight/graph-behavior-analysis', { params })
    .then((r) => r.data)
}

export type MasteryScope = 'overall' | 'grade' | 'class'

export type TreemapNode = {
  name: string
  value: number
  children?: TreemapNode[]
}

export type MasteryTreemapResponse = {
  tree: TreemapNode[]
}

export type MasteryTrajectoryPoint = {
  date: string
  weak: number
  familiar: number
  mastery: number
}

export function fetchMasteryDistributionAnalysis(params: {
  scope: MasteryScope
  grade?: string
  classId?: string
}) {
  return http.get<MasteryTreemapResponse>('/api/insight/mastery-distribution-analysis', { params }).then((r) => r.data)
}

export function fetchMasteryTrajectory(params: { userId: string }) {
  return http
    .get<{ userId: string; points: MasteryTrajectoryPoint[] }>('/api/insight/mastery-trajectory', { params })
    .then((r) => r.data)
}

export type ReviewKpi = {
  period: 'today' | 'week' | 'month'
  totalReviews: number
  weakToMastery: number
  efficiencyRate: number
}

export type ReviewDisorderMetric = {
  disorderIndex: number
  trend7d: ChartSeriesPoint[]
  efficiencySequential: number
  efficiencyDisorder: number
}

export type UncoveredWeakItem = {
  nodeName: string
  lastMarkedAt: string
}

export function fetchReviewEfficiencyAnalysis() {
  return http
    .get<{ kpis: ReviewKpi[]; disorder: ReviewDisorderMetric; uncovered: UncoveredWeakItem[] }>(
      '/api/insight/review-efficiency-analysis',
    )
    .then((r) => r.data)
}

export function pushReviewReminder(payload: { nodes: string[] }) {
  return http.post<{ ok: boolean }>('/api/insight/review-reminder/push', payload).then((r) => r.data)
}

export function fetchInsightMasteryDistribution() {
  return http
    .get<{ table: Array<{ band: string; users: number; avgMastery: number }>; distribution: ChartSeriesPoint[] }>(
      '/api/insight/mastery-distribution',
    )
    .then((r) => r.data)
}

export function fetchInsightReviewEfficiency() {
  return http
    .get<{ table: Array<{ day: string; sessions: number; avgGain: number }>; line: ChartSeriesPoint[] }>(
      '/api/insight/review-efficiency',
    )
    .then((r) => r.data)
}

export type SearchNoResultWord = {
  word: string
  count: number
}

export type SearchIntentItem = {
  intent: string
  count: number
  percent: number
}

export type SearchBehaviorAnalysis = {
  noResultWords: SearchNoResultWord[]
  bounceRate: number
  bounceThreshold: number
  intents: SearchIntentItem[]
}

export function fetchSearchBehaviorAnalysis() {
  return http.get<SearchBehaviorAnalysis>('/api/insight/search-behavior-analysis').then((r) => r.data)
}

export function createGraphNodeFromWord(payload: { word: string }) {
  return http.post<{ ok: boolean }>('/api/insight/search-noresult/create-node', payload).then((r) => r.data)
}

export function addAliasFromWord(payload: { word: string }) {
  return http.post<{ ok: boolean }>('/api/insight/search-noresult/add-alias', payload).then((r) => r.data)
}

export function fetchInsightSearchAnalysis() {
  return http
    .get<{
      table: Array<{ keyword: string; pv: number; uv: number; ctr: number }>
      top: ChartSeriesPoint[]
    }>('/api/insight/search-analysis')
    .then((r) => r.data)
}

export type AiSolveRate = {
  solveRate: number
  threshold: number
}

export type AiFollowupWord = {
  word: string
  count: number
  suggestion: string
}

export type AiLowScoreItem = {
  id: string
  question: string
  feedback: string
  promptBefore: string
  promptAfter?: string
  score: number
  createdAt: string
}

export function fetchAiEffectAnalysis() {
  return http
    .get<{ solve: AiSolveRate; followups: AiFollowupWord[]; lowScore: AiLowScoreItem[] }>(
      '/api/insight/ai-effect-analysis',
    )
    .then((r) => r.data)
}

export function saveAiPromptFix(payload: { id: string; promptAfter: string }) {
  return http.post<{ ok: boolean }>('/api/insight/ai-effect/prompt-fix', payload).then((r) => r.data)
}

export function fetchInsightAIEffect() {
  return http
    .get<{
      table: Array<{ model: string; hitRate: number; adoption: number; satisfaction: number }>
      bar: ChartSeriesPoint[]
    }>('/api/insight/ai-effect')
    .then((r) => r.data)
}

export function fetchInsightPathReplay() {
  return http
    .get<{
      table: Array<{ step: string; users: number; dropRate: number }>
      bar: ChartSeriesPoint[]
    }>('/api/insight/path-replay')
    .then((r) => r.data)
}

export type GoldenPath = {
  name: string
  steps: string[]
  users: number
  successRate: number
}

export type DropoffItem = {
  page: string
  dropUsers: number
}

export type ActionLogItem = {
  time: string
  event: string
  detail?: string
}

export function fetchPathReplayAnalysis() {
  return http
    .get<{ golden: GoldenPath; dropoffs: DropoffItem[] }>('/api/insight/path-replay-analysis')
    .then((r) => r.data)
}

export function fetchDropoffActionLogs(params: { page: string }) {
  return http.get<{ list: ActionLogItem[] }>('/api/insight/path-replay/dropoff-logs', { params }).then((r) => r.data)
}

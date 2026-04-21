import type { MockMethod } from 'vite-plugin-mock'

type LearnerPersonaType = 'steady' | 'exam' | 'explore' | 'efficient'

type LearnerPortraitUser = {
  userId: string
  nickname: string
  school: string
  grade: string
  major: string
  personaType: LearnerPersonaType
  lastTestAt: string
}

type LearnerPortraitReport = {
  userId: string
  nickname: string
  indicators: Array<{ name: string; max: number }>
  values: number[]
  dimensionScores: Array<{ name: string; score: number }>
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

const personaLabels: Record<LearnerPersonaType, string> = {
  steady: '稳扎稳打型',
  exam: '备考冲刺型',
  explore: '探索拓展型',
  efficient: '高效掌握型',
}

const schools = ['北京中医药大学', '上海交通大学医学院', '复旦大学', '四川大学华西医学中心', '中山大学']
const majors = ['中医学', '临床医学', '针灸推拿学', '基础医学', '药学', '护理学']
const grades = ['大一', '大二', '大三', '大四', '规培', '研究生']
const personaTypes: LearnerPersonaType[] = ['steady', 'exam', 'explore', 'efficient']

const users: LearnerPortraitUser[] = Array.from({ length: 56 }).map((_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (i % 18))
  date.setMinutes(date.getMinutes() - (i % 60))
  return {
    userId: `LP${String(i + 1).padStart(6, '0')}`,
    nickname: `学习者${i + 1}`,
    school: schools[i % schools.length],
    grade: grades[(i * 3) % grades.length],
    major: majors[(i * 5) % majors.length],
    personaType: personaTypes[i % personaTypes.length],
    lastTestAt: formatDate(date),
  }
})

function countDistribution(list: LearnerPortraitUser[]) {
  const map = new Map<LearnerPersonaType, number>()
  for (const u of list) {
    map.set(u.personaType, (map.get(u.personaType) ?? 0) + 1)
  }
  return personaTypes.map((t) => ({ name: personaLabels[t], value: map.get(t) ?? 0 }))
}

function activeLearnersCount(list: LearnerPortraitUser[]) {
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return list.filter((u) => {
    const ts = Date.parse(u.lastTestAt.replace(' ', 'T'))
    return !Number.isNaN(ts) && now - ts <= sevenDays
  }).length
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function hashToScore(seed: string, base: number) {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) % 997
  }
  return clamp(Math.round(base + (h % 31) - 15), 30, 98)
}

function makeReport(user: LearnerPortraitUser): LearnerPortraitReport {
  const dims = ['基础知识', '临床推理', '检索能力', '复习规律', '学习投入']
  const bases: Record<LearnerPersonaType, number> = {
    steady: 68,
    exam: 74,
    explore: 66,
    efficient: 80,
  }
  const dimensionScores = dims.map((name, idx) => ({
    name,
    score: hashToScore(`${user.userId}-${idx}-${user.personaType}`, bases[user.personaType]),
  }))
  return {
    userId: user.userId,
    nickname: user.nickname,
    indicators: dims.map((name) => ({ name, max: 100 })),
    values: dimensionScores.map((d) => d.score),
    dimensionScores,
  }
}

function makeHistory(userId: string) {
  const now = new Date()
  return [
    {
      time: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      title: '完成一次诊断练习',
      detail: '题型：辨证论治；用时：7m32s',
    },
    {
      time: formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
      title: '完成阶段测评',
      detail: `用户 ${userId} 已生成画像报告`,
    },
    {
      time: formatDate(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)),
      title: '学习路径更新',
      detail: '新增 3 个知识点收藏',
    },
  ]
}

const mocks: MockMethod[] = [
  {
    url: '/api/learner/portrait/summary',
    method: 'get',
    response: () => {
      return {
        totalUsers: users.length,
        activeLearners: activeLearnersCount(users),
        distribution: countDistribution(users),
      }
    },
  },
  {
    url: '/api/learner/portrait/list',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const page = Math.max(1, Number(query.page ?? 1))
      const pageSize = Math.max(1, Number(query.pageSize ?? 10))
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return { total: users.length, list: users.slice(start, end) }
    },
  },
  {
    url: '/api/learner/portrait/report',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const userId = String(query.userId ?? '')
      const user = users.find((u) => u.userId === userId) ?? users[0]
      return makeReport(user)
    },
  },
  {
    url: '/api/learner/portrait/history',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const userId = String(query.userId ?? '')
      return { list: makeHistory(userId) }
    },
  },
] 

export default mocks


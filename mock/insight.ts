import type { MockMethod } from 'vite-plugin-mock'

function lastNDays(n: number) {
  const list: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    list.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  return list
}

export default [
  {
    url: '/api/insight/graph-behavior',
    method: 'get',
    response: () => {
      const days = lastNDays(7)
      return {
        table: [
          { action: '展开知识点', count: 18432, users: 6231 },
          { action: '关联跳转', count: 11290, users: 4021 },
          { action: '收藏', count: 3560, users: 1987 },
          { action: '错题回看', count: 7921, users: 3210 },
        ],
        trend: days.map((name, idx) => ({ name, value: 1800 + idx * 120 + (idx % 2) * 90 })),
      }
    },
  },
  {
    url: '/api/dashboard/overview',
    method: 'get',
    response: () => {
      const days = lastNDays(7)
      const dauTrend7d = days.map((name, idx) => ({ name, value: 11800 + idx * 280 + (idx % 2) * 340 }))
      const courseTimeShare = [
        { courseId: 'COURSE_001', courseName: '中医基础入门', minutes: 1260 },
        { courseId: 'COURSE_002', courseName: '西医基础总论', minutes: 980 },
        { courseId: 'COURSE_003', courseName: '临床思维训练', minutes: 740 },
        { courseId: 'COURSE_X', courseName: '其他课程', minutes: 520 },
      ]
      const hotKnowledgeTop10 = [
        { knowledgeId: 'K001', name: '阴阳学说', learners: 6820 },
        { knowledgeId: 'K002', name: '五行学说', learners: 6412 },
        { knowledgeId: 'K003', name: '脏腑学说', learners: 5983 },
        { knowledgeId: 'K004', name: '心电图判读', learners: 5710 },
        { knowledgeId: 'K005', name: '急性胰腺炎', learners: 5428 },
        { knowledgeId: 'K006', name: '呼吸衰竭', learners: 5186 },
        { knowledgeId: 'K007', name: '肾小球肾炎', learners: 4912 },
        { knowledgeId: 'K008', name: '高血压危象', learners: 4680 },
        { knowledgeId: 'K009', name: '糖尿病酮症', learners: 4521 },
        { knowledgeId: 'K010', name: '急性冠脉综合征', learners: 4390 },
      ]
      const avgStudyMinutes = 36.5
      const masteryRate = 72.3
      const aiQaCount = 18420

      return {
        metrics: [
          { key: 'dau', name: '日活 DAU', value: dauTrend7d[dauTrend7d.length - 1].value },
          { key: 'avgStudyMinutes', name: '平均学习时长', value: avgStudyMinutes, unit: 'min/人' },
          { key: 'masteryRate', name: '知识点掌握率', value: masteryRate, unit: '%' },
          { key: 'aiQaCount', name: 'AI 问答次数', value: aiQaCount },
        ],
        dauTrend7d,
        courseTimeShare,
        hotKnowledgeTop10,
      }
    },
  },
  {
    url: '/api/insight/graph-behavior-analysis',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const courseId = typeof query.courseId === 'string' ? query.courseId : ''
      const courses = [
        { id: 'COURSE_001', name: '中医基础入门' },
        { id: 'COURSE_002', name: '西医基础总论' },
        { id: 'COURSE_003', name: '临床思维训练' },
      ]
      const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? id

      const baseHeat = [
        { nodeName: '气血津液辨证', courseId: 'COURSE_001', clicks: 8620 },
        { nodeName: '气病辨证', courseId: 'COURSE_001', clicks: 7330 },
        { nodeName: '气陷证', courseId: 'COURSE_001', clicks: 5210 },
        { nodeName: '血虚证', courseId: 'COURSE_001', clicks: 4870 },
        { nodeName: '痰饮证', courseId: 'COURSE_001', clicks: 4620 },
        { nodeName: '心电图判读', courseId: 'COURSE_002', clicks: 6990 },
        { nodeName: '呼吸衰竭', courseId: 'COURSE_002', clicks: 5580 },
        { nodeName: '急性胰腺炎', courseId: 'COURSE_002', clicks: 5290 },
        { nodeName: '体格检查', courseId: 'COURSE_003', clicks: 4930 },
        { nodeName: '病史采集', courseId: 'COURSE_003', clicks: 4680 },
      ]
        .filter((x) => (courseId ? x.courseId === courseId : true))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10)
        .map((x) => ({ ...x, courseName: courseName(x.courseId) }))

      const difficultyBase = [
        { nodeName: '气陷证', courseId: 'COURSE_001', avgStaySeconds: 95, revisitCount: 48 },
        { nodeName: '痰饮证', courseId: 'COURSE_001', avgStaySeconds: 88, revisitCount: 44 },
        { nodeName: '血虚证', courseId: 'COURSE_001', avgStaySeconds: 82, revisitCount: 41 },
        { nodeName: '呼吸衰竭', courseId: 'COURSE_002', avgStaySeconds: 76, revisitCount: 52 },
        { nodeName: '急性胰腺炎', courseId: 'COURSE_002', avgStaySeconds: 73, revisitCount: 49 },
        { nodeName: '心电图判读', courseId: 'COURSE_002', avgStaySeconds: 69, revisitCount: 55 },
        { nodeName: '辅助检查', courseId: 'COURSE_003', avgStaySeconds: 64, revisitCount: 46 },
        { nodeName: '影像学', courseId: 'COURSE_003', avgStaySeconds: 61, revisitCount: 43 },
        { nodeName: '临床推理链', courseId: 'COURSE_003', avgStaySeconds: 58, revisitCount: 44 },
        { nodeName: '鉴别诊断', courseId: 'COURSE_003', avgStaySeconds: 56, revisitCount: 42 },
        { nodeName: '气病辨证', courseId: 'COURSE_001', avgStaySeconds: 54, revisitCount: 39 },
        { nodeName: '气血津液辨证', courseId: 'COURSE_001', avgStaySeconds: 49, revisitCount: 38 },
      ]
        .filter((x) => (courseId ? x.courseId === courseId : true))
        .map((x) => ({
          nodeName: x.nodeName,
          courseName: courseName(x.courseId),
          avgStaySeconds: x.avgStaySeconds,
          revisitCount: x.revisitCount,
          difficultyIndex: x.avgStaySeconds * x.revisitCount,
        }))
        .sort((a, b) => b.difficultyIndex - a.difficultyIndex)
        .slice(0, 10)

      const sankeyLinks = [
        { source: '气血津液辨证', target: '气病辨证', value: 3200 },
        { source: '气病辨证', target: '气陷证', value: 1800 },
        { source: '气病辨证', target: '气虚证', value: 1200 },
        { source: '气血津液辨证', target: '血病辨证', value: 2400 },
        { source: '血病辨证', target: '血虚证', value: 1500 },
        { source: '血病辨证', target: '血瘀证', value: 900 },
        { source: '体格检查', target: '辅助检查', value: 1600 },
        { source: '辅助检查', target: '影像学', value: 980 },
        { source: '辅助检查', target: '实验室检查', value: 620 },
      ]

      const sankeyNodes = Array.from(new Set(sankeyLinks.flatMap((l) => [l.source, l.target]))).map((name) => ({
        id: name,
        name,
      }))

      return {
        heatList: baseHeat,
        difficultyTop10: difficultyBase,
        sankey: { nodes: sankeyNodes, links: sankeyLinks },
      }
    },
  },
  {
    url: '/api/insight/mastery-distribution-analysis',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const scope = (query.scope === 'class' ? 'class' : query.scope === 'grade' ? 'grade' : 'overall') as
        | 'overall'
        | 'grade'
        | 'class'
      const grade = typeof query.grade === 'string' ? query.grade : ''
      const classId = typeof query.classId === 'string' ? query.classId : ''

      const seed = `${scope}-${grade}-${classId}`
      let h = 0
      for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 9973
      const rnd = () => {
        h = (h * 1103515245 + 12345) % 2147483647
        return h / 2147483647
      }

      const makeSection = (name: string) => {
        const weak = Math.round(10 + rnd() * 70 * (scope === 'overall' ? 0.9 : 1))
        return { name, value: weak }
      }

      const chapters = [
        { name: '第一章：辨证基础', sections: ['阴阳', '五行', '八纲'] },
        { name: '第二章：气血津液', sections: ['气病', '血病', '津液'] },
        { name: '第三章：脏腑辨证', sections: ['心', '肝', '脾', '肺', '肾'] },
        { name: '第四章：经络辨证', sections: ['十二经', '奇经八脉'] },
        { name: '第五章：病因病机', sections: ['六淫', '七情', '痰饮'] },
        { name: '第六章：临床要点', sections: ['鉴别', '治法', '方药'] },
      ]

      const tree = chapters.map((c) => ({
        name: c.name,
        value: 0,
        children: c.sections.map((s) => makeSection(`${c.name.split('：')[0]}-${s}`)),
      }))

      for (const ch of tree) {
        const children = ch.children ?? []
        const avg = children.length ? children.reduce((sum, x) => sum + x.value, 0) / children.length : 0
        ch.value = Number(avg.toFixed(1))
      }

      return { tree }
    },
  },
  {
    url: '/api/insight/mastery-trajectory',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const userId = String(query.userId ?? '')
      const now = new Date()
      const points: Array<{ date: string; weak: number; familiar: number; mastery: number }> = []

      let h = 0
      for (let i = 0; i < userId.length; i += 1) h = (h * 31 + userId.charCodeAt(i)) % 9973
      const noise = (i: number) => {
        const v = Math.sin((i + 1) * 1.7 + h) * 4 + Math.cos((i + 1) * 0.9 + h) * 3
        return v
      }

      for (let i = 29; i >= 0; i -= 1) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        const label = `${d.getMonth() + 1}/${d.getDate()}`

        const t = (29 - i) / 29
        const masteryBase = 25 + t * 55
        const weakBase = 60 - t * 50
        const familiarBase = 15 + Math.sin(t * Math.PI) * 20

        let mastery = masteryBase + noise(i) * 0.6
        let weak = weakBase - noise(i) * 0.4
        let familiar = familiarBase + noise(i) * 0.2

        mastery = Math.max(5, Math.min(95, mastery))
        weak = Math.max(5, Math.min(95, weak))
        familiar = Math.max(0, Math.min(95, familiar))

        const sum = mastery + weak + familiar
        mastery = (mastery / sum) * 100
        weak = (weak / sum) * 100
        familiar = 100 - mastery - weak

        points.push({
          date: label,
          weak: Number(weak.toFixed(1)),
          familiar: Number(familiar.toFixed(1)),
          mastery: Number(mastery.toFixed(1)),
        })
      }

      return { userId, points }
    },
  },
  {
    url: '/api/insight/review-efficiency-analysis',
    method: 'get',
    response: () => {
      const days = lastNDays(7)
      const trend7d = days.map((name, idx) => ({ name, value: 0.52 + idx * 0.015 + (idx % 2) * 0.01 }))
      const efficiencySequential = 0.68
      const efficiencyDisorder = 0.59
      const disorderIndex = 0.74

      return {
        kpis: [
          { period: 'today', totalReviews: 480, weakToMastery: 92, efficiencyRate: 92 / 480 },
          { period: 'week', totalReviews: 3120, weakToMastery: 724, efficiencyRate: 724 / 3120 },
          { period: 'month', totalReviews: 12680, weakToMastery: 3188, efficiencyRate: 3188 / 12680 },
        ],
        disorder: {
          disorderIndex,
          trend7d: trend7d.map((p) => ({ name: p.name, value: Number((p.value * 100).toFixed(1)) })),
          efficiencySequential: Number((efficiencySequential * 100).toFixed(1)),
          efficiencyDisorder: Number((efficiencyDisorder * 100).toFixed(1)),
        },
        uncovered: [
          { nodeName: '气陷证', lastMarkedAt: '2026-04-10 21:35' },
          { nodeName: '痰饮证', lastMarkedAt: '2026-04-11 19:08' },
          { nodeName: '血虚证', lastMarkedAt: '2026-04-12 10:42' },
          { nodeName: '呼吸衰竭', lastMarkedAt: '2026-04-13 17:26' },
          { nodeName: '心电图判读', lastMarkedAt: '2026-04-14 08:16' },
          { nodeName: '鉴别诊断', lastMarkedAt: '2026-04-14 23:07' },
        ],
      }
    },
  },
  {
    url: '/api/insight/review-reminder/push',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const nodes = Array.isArray(body.nodes) ? body.nodes : []
      return { ok: nodes.length > 0 }
    },
  },
  {
    url: '/api/insight/search-behavior-analysis',
    method: 'get',
    response: () => {
      const noResultWords = [
        { word: '气陷证方剂', count: 680 },
        { word: '痰饮证定义', count: 612 },
        { word: '血虚证鉴别', count: 578 },
        { word: '气滞血瘀区别', count: 540 },
        { word: '经络辨证口诀', count: 498 },
        { word: '六淫辨证图谱', count: 472 },
        { word: '心电图速记', count: 445 },
        { word: '急性胰腺炎护理', count: 420 },
        { word: '肾小球肾炎用药', count: 398 },
        { word: '高血压危象处理', count: 372 },
        { word: '糖尿病酮症流程', count: 350 },
        { word: '气虚证要点', count: 332 },
        { word: '血瘀证舌象', count: 318 },
        { word: '脾胃虚弱食疗', count: 302 },
        { word: '呼吸衰竭分型', count: 289 },
      ]

      const bounceRate = 0.672
      const bounceThreshold = 0.62

      const intents = [
        { intent: '查定义', count: 12400, percent: 46.2 },
        { intent: '找方剂', count: 8900, percent: 33.2 },
        { intent: '对比区别', count: 5520, percent: 20.6 },
      ]

      return { noResultWords, bounceRate, bounceThreshold, intents }
    },
  },
  {
    url: '/api/insight/search-noresult/create-node',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const word = String(body.word ?? '')
      return { ok: Boolean(word) }
    },
  },
  {
    url: '/api/insight/search-noresult/add-alias',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const word = String(body.word ?? '')
      return { ok: Boolean(word) }
    },
  },
  {
    url: '/api/insight/ai-effect-analysis',
    method: 'get',
    response: () => {
      return {
        solve: { solveRate: 0.57, threshold: 0.6 },
        followups: [
          { word: '举个例子', count: 3420, suggestion: '补充更贴近医学场景的例子，并明确输出结构' },
          { word: '更详细一点', count: 2810, suggestion: '增加分点说明、补齐关键步骤与注意事项' },
          { word: '给出诊断依据', count: 1960, suggestion: '强调证据链与引用来源（指南/教材）' },
          { word: '能不能总结', count: 1730, suggestion: '增加 TL;DR，总结 3-5 条关键结论' },
          { word: '对比一下', count: 1520, suggestion: '增加对比表格维度：定义/要点/鉴别/处理' },
        ],
        lowScore: [
          {
            id: 'AIS_001',
            question: '气陷证与气虚证如何鉴别？',
            feedback: '回答太泛，缺少具体鉴别要点和例子。',
            promptBefore: '请回答用户问题。',
            score: 2.1,
            createdAt: '2026-04-14 10:12',
          },
          {
            id: 'AIS_002',
            question: '急性胰腺炎的处理流程是什么？',
            feedback: '步骤不清晰，没有强调禁食、补液、监护等重点。',
            promptBefore: '给出处理建议。',
            score: 2.4,
            createdAt: '2026-04-14 18:37',
          },
          {
            id: 'AIS_003',
            question: '心电图 ST 段抬高怎么判断？',
            feedback: '缺少判断标准与常见陷阱。',
            promptBefore: '解释 ST 段抬高判断。',
            score: 2.0,
            createdAt: '2026-04-15 09:05',
          },
        ],
      }
    },
  },
  {
    url: '/api/insight/ai-effect/prompt-fix',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const id = String(body.id ?? '')
      const promptAfter = String(body.promptAfter ?? '')
      return { ok: Boolean(id && promptAfter) }
    },
  },
  {
    url: '/api/insight/path-replay-analysis',
    method: 'get',
    response: () => {
      return {
        golden: {
          name: '黄金路径（最常见成功学习路径）',
          steps: ['绪论', '阴阳学说', '气血津液辨证', '练习'],
          users: 4260,
          successRate: 0.62,
        },
        dropoffs: [
          { page: '知识点详情页', dropUsers: 1380 },
          { page: '练习入口页', dropUsers: 1120 },
          { page: '题目解析页', dropUsers: 860 },
          { page: '搜索结果页', dropUsers: 730 },
          { page: '课程目录页', dropUsers: 590 },
        ],
      }
    },
  },
  {
    url: '/api/insight/path-replay/dropoff-logs',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const page = String(query.page ?? '')
      const now = new Date()
      const pad2 = (n: number) => String(n).padStart(2, '0')
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
      const mk = (minsAgo: number, event: string, detail?: string) => {
        const d = new Date(now)
        d.setMinutes(now.getMinutes() - minsAgo)
        return { time: fmt(d), event, detail }
      }
      const list = [
        mk(4, 'page_view', `进入页面：${page}`),
        mk(3, 'scroll', '滚动到 35%'),
        mk(2, 'click', '点击：返回'),
        mk(1, 'leave', '停留 18s 后离开'),
      ]
      return { list }
    },
  },
  {
    url: '/api/insight/mastery-distribution',
    method: 'get',
    response: () => {
      const distribution = [
        { name: '0-20%', value: 412 },
        { name: '20-40%', value: 928 },
        { name: '40-60%', value: 1520 },
        { name: '60-80%', value: 1033 },
        { name: '80-100%', value: 506 },
      ]
      return {
        table: distribution.map((d) => ({
          band: d.name,
          users: d.value,
          avgMastery: Number(d.name.split('-')[0]),
        })),
        distribution,
      }
    },
  },
  {
    url: '/api/insight/review-efficiency',
    method: 'get',
    response: () => {
      const days = lastNDays(7)
      const line = days.map((name, idx) => ({ name, value: 12 + idx * 1.3 + (idx % 2) * 2.1 }))
      return {
        table: days.map((day, idx) => ({ day, sessions: 420 + idx * 18, avgGain: Number(line[idx].value.toFixed(1)) })),
        line: line.map((p) => ({ name: p.name, value: Number(p.value.toFixed(1)) })),
      }
    },
  },
  {
    url: '/api/insight/search-analysis',
    method: 'get',
    response: () => {
      const keywords = [
        '心电图',
        '急性胰腺炎',
        '呼吸衰竭',
        '肾小球肾炎',
        '糖尿病酮症',
        '抗菌药物',
        '高血压危象',
        '急性冠脉综合征',
      ]
      const table = keywords.map((keyword, i) => {
        const pv = 800 + i * 110 + (i % 2) * 70
        const uv = 420 + i * 70 + (i % 3) * 35
        const ctr = Number(((18 + i * 1.2 + (i % 2) * 2.3) % 40).toFixed(1))
        return { keyword, pv, uv, ctr }
      })
      const top = table
        .slice()
        .sort((a, b) => b.pv - a.pv)
        .slice(0, 6)
        .map((r) => ({ name: r.keyword, value: r.pv }))
      return { table, top }
    },
  },
  {
    url: '/api/insight/ai-effect',
    method: 'get',
    response: () => {
      const table = [
        { model: 'MedGPT-Base', hitRate: 72.4, adoption: 45.3, satisfaction: 81.2 },
        { model: 'MedGPT-Pro', hitRate: 78.9, adoption: 52.1, satisfaction: 84.6 },
        { model: 'RAG-Guide', hitRate: 83.2, adoption: 58.4, satisfaction: 86.9 },
      ].map((r) => ({
        ...r,
        hitRate: Number(r.hitRate.toFixed(1)),
        adoption: Number(r.adoption.toFixed(1)),
        satisfaction: Number(r.satisfaction.toFixed(1)),
      }))
      return {
        table,
        bar: table.map((r) => ({ name: r.model, value: r.hitRate })),
      }
    },
  },
  {
    url: '/api/insight/path-replay',
    method: 'get',
    response: () => {
      const steps = [
        { step: '进入首页', users: 12000, dropRate: 0 },
        { step: '进入搜索', users: 8600, dropRate: 28.3 },
        { step: '打开内容', users: 6100, dropRate: 29.1 },
        { step: '开始学习', users: 4300, dropRate: 29.5 },
        { step: '完成一次练习', users: 2800, dropRate: 34.9 },
      ].map((s) => ({ ...s, dropRate: Number(s.dropRate.toFixed(1)) }))
      return {
        table: steps,
        bar: steps.map((s) => ({ name: s.step, value: s.users })),
      }
    },
  },
] as MockMethod[]

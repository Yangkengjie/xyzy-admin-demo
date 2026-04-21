import type { MockMethod } from 'vite-plugin-mock'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function makeList(total: number) {
  const levels = ['大一', '大二', '大三', '大四', '规培', '研究生']
  const specialties = ['内科', '外科', '儿科', '急诊', '影像', '检验']
  return Array.from({ length: total }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (i % 9))
    date.setMinutes(date.getMinutes() - (i % 60))
    return {
      userId: `U${String(i + 1).padStart(6, '0')}`,
      name: `用户${i + 1}`,
      level: levels[i % levels.length],
      specialty: specialties[i % specialties.length],
      activeDays: 3 + ((i * 7) % 30),
      lastActiveAt: formatDate(date),
    }
  })
}

const mocks: MockMethod[] = [
  {
    url: '/api/user/profile/list',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const total = 68
      const page = Math.max(1, Number(query.page ?? 1))
      const pageSize = Math.max(1, Number(query.pageSize ?? 10))
      const all = makeList(total)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return { total, list: all.slice(start, end) }
    },
  },
]

export default mocks

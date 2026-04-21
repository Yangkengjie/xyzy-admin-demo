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
    url: '/api/system/summary',
    method: 'get',
    response: () => {
      const days = lastNDays(7)
      const trend = days.map((name, idx) => ({ name, value: 820 + idx * 37 + (idx % 2) * 55 }))
      return {
        metrics: [
          { key: 'dau', name: 'DAU', value: 12456 },
          { key: 'api_qps', name: 'API QPS', value: 368 },
          { key: 'ai_cost', name: 'AI 成本', value: 2410, unit: '¥/天' },
          { key: 'latency', name: 'P95 延迟', value: 186, unit: 'ms' },
        ],
        trend,
      }
    },
  },
] as MockMethod[]


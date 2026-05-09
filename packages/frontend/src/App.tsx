import { useMemo } from 'react'
import { apiBaseUrl } from './api/client'

export function App() {
  const apiUrl = useMemo(() => apiBaseUrl, [])

  return (
    <main className="app">
      <header className="topbar">
        <h1>租房对比地图工具</h1>
        <p>骨架已初始化：前端 + Hono BFF + JSON 数据层</p>
      </header>

      <section className="panel">
        <h2>当前状态</h2>
        <ul>
          <li>前端 API Base URL: {apiUrl}</li>
          <li>数据文件: data/properties.json, data/targets.json, data/settings.json</li>
          <li>后端路由: /api/health, /api/properties, /api/targets, /api/amap/*</li>
        </ul>
      </section>
    </main>
  )
}

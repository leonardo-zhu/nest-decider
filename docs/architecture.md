# 租房对比地图工具 — 架构方案

> 文档版本：v0.5 MVP · 技术栈：Vite + React / Hono / 火山引擎 TOS / 高德地图 JS API

---

## 一、整体架构

```
┌─────────────────────────────────────────────────────────┐
│                        用户浏览器                         │
│                  (PC / iPhone Safari)                    │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
  ② API 调用                 ① 静态资源 + ③ 图片/视频直链
           │                          │
┌──────────▼──────────┐   ┌───────────▼──────────────────┐
│    do-sg VPS        │   │       火山引擎 TOS              │
│  rent.leonardo-      │   │  静态网站托管（dist/）          │
│    zhu.me           │   │  媒体文件存储（media/）         │
│                     │   │  国内 CDN 节点，TOS Endpoint   │
│  Caddy              │   └──────────────────────────────┘
│  └─ /* → Hono      │
│                     │
│  Hono BFF (Node)    │
│  ├─ 业务路由编排      │
│  ├─ 高德 WebService  │
│  ├─ AI 评估路由       │
│  └─ 读写 JSON 数据层  │
└──────────┬──────────┘
           │
  ④ 转发至高德 / AI / TOS
           │
┌──────────▼──────────────────────────────────────────────┐
│                   外部服务 API                            │
│    高德 · OpenAI · 豆包 · TOS(S3兼容)                     │
└─────────────────────────────────────────────────────────┘
```

### 请求链路说明

| 步骤 | 描述 |
|------|------|
| ① 静态资源 | 浏览器从 TOS Endpoint 拉取前端 build 产物，国内 CDN 节点响应 |
| ② API 调用 | 浏览器请求 `rent.leonardo-zhu.me`，Caddy 反代至 Hono；跨域，Hono 需加 CORS 头 |
| ③ 媒体文件 | 图片 / 视频存于 TOS `media/` 目录，`properties.json` 里记录直链，浏览器直接拉取 |
| ④ 服务代理 | Hono 使用服务端凭证调用高德 Web Service、AI 服务、TOS 预签名与删除接口 |

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vite + React | SPA，pnpm 管理 |
| 后端 | Hono (Node) | BFF，业务 API + 外部服务编排 |
| 静态托管 | 火山引擎 TOS | 前端 build 产物 + 媒体文件，国内 CDN |
| 地图 | 高德地图 JS API 2.0 | 前端引入，WebGL 渲染 |
| 地图服务端调用 | 高德 Web Service | 路径规划 / 地理编码 / POI / 到达圈 |
| AI | OpenAI SDK + 豆包 HTTP API | 单套评估 / 多套对比 |
| 对象存储接入 | AWS SDK v3 (S3 协议) | TOS 预签名上传、对象删除 |
| 配置 | dotenv + dotenv-expand | 自动加载 `.env*` |
| 反代 | Caddy | HTTPS 终结，`rent.leonardo-zhu.me` → Hono |
| 数据存储 | `properties.json` + `targets.json` + `settings.json` | 存于 do-sg，Hono 直接读写 |
| 包管理 | pnpm workspace | 前后端 monorepo |

---

## 三、项目结构

```
nest-decider/
├── packages/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   └── client.ts
│   │   │   └── ...
│   │   └── vite.config.ts
│   │
│   └── server/
│       ├── src/
│       │   ├── clients/
│       │   │   └── amap-client.ts
│       │   ├── config/
│       │   │   └── env.ts
│       │   ├── core/
│       │   │   ├── errors.ts
│       │   │   └── http.ts
│       │   ├── domains/
│       │   │   ├── types.ts
│       │   │   ├── store.ts
│       │   │   ├── validation.ts
│       │   │   └── services.ts
│       │   ├── routes/
│       │   │   ├── amap.ts
│       │   │   ├── property.ts
│       │   │   ├── target.ts
│       │   │   ├── commute.ts
│       │   │   ├── poi.ts
│       │   │   ├── arrival.ts
│       │   │   ├── media.ts
│       │   │   └── ai.ts
│       │   └── index.ts
│       └── tsconfig.json
│
├── data/
│   ├── properties.json
│   ├── targets.json
│   └── settings.json
│
├── .env.example
├── .env.local.example
├── pnpm-workspace.yaml
└── package.json
```

---

## 四、后端 API（当前实现）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/properties` | GET/POST | 房源列表 / 新建 |
| `/api/properties/:id` | GET/PUT/DELETE | 房源详情 / 更新 / 删除 |
| `/api/targets` | GET/POST | 目标地点列表 / 新建 |
| `/api/targets/:id` | PUT/DELETE | 目标地点更新 / 删除 |
| `/api/targets/active/:id` | PUT | 激活目标地点 |
| `/api/targets/active` | PUT | 设置或清空激活目标 |
| `/api/commute/refresh-fixed` | POST | 按激活目标批量刷新通勤缓存 |
| `/api/commute/query-temp` | POST | 临时地点通勤查询（不落盘） |
| `/api/poi/:propertyId` | GET | 周边 POI（地铁/商超/医院） |
| `/api/arrival-range` | GET | 公共交通到达圈 |
| `/api/media/presign-upload` | POST | 生成 TOS 预签名上传 URL |
| `/api/media` | DELETE | 删除媒体并联动移除房源 `mediaUrls` |
| `/api/ai/evaluate` | POST | AI 房源评估（OpenAI / 豆包） |
| `/api/amap/*` | GET | 透传高德 Web Service |

---

## 五、环境变量与配置加载

后端会按顺序自动加载（存在才加载）：

1. `.env`
2. `.env.local`
3. `.env.{NODE_ENV}`
4. `.env.{NODE_ENV}.local`

主要变量：

- 服务：`PORT`, `CORS_ORIGIN`
- 高德：`AMAP_WEB_KEY`, `AMAP_WEB_SIG`, `COMMUTE_CONCURRENCY`
- TOS：`TOS_ENDPOINT`, `TOS_REGION`, `TOS_BUCKET`, `TOS_ACCESS_KEY_ID`, `TOS_SECRET_ACCESS_KEY`
- AI：`AI_PROVIDER(openai|doubao)`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `DOUBAO_BASE_URL`, `DOUBAO_API_KEY`, `DOUBAO_MODEL`

示例文件：
- `.env.example`
- `.env.local.example`

---

## 六、通勤与 AI 口径

- 通勤时间口径：公共交通总耗时（默认地铁优先，含步行接驳）
- 固定目标通勤：写入 `commuteCache`
- 临时查询通勤：仅返回结果，不持久化
- AI provider：已移除 Claude，仅保留 `openai` 与 `doubao`
- OpenAI 调用方式：使用 OpenAI 官方 SDK

---

*文档版本：Architecture v0.5 · 已与当前后端实现对齐*

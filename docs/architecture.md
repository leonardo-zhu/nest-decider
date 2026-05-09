# 租房对比地图工具 — 架构方案

> MVP 阶段文档 · 技术栈：Vite + React / Hono / 火山引擎 TOS / 高德地图 JS API

---

## 一、整体架构

```
┌─────────────────────────────────────────────────────────┐
│                        用户浏览器                         │
│                  (PC / iPhone Safari)                    │
└────────────────────┬────────────────────────────────────┘
                     │
          ① 访问静态资源（HTML / JS / CSS）
                     │
┌────────────────────▼────────────────────────────────────┐
│              火山引擎 TOS（对象存储）                      │
│         静态网站托管 · 自定义域名 · 国内访问快              │
└────────────────────┬────────────────────────────────────┘
                     │
          ② 地图 JS SDK 直接加载（高德 CDN）
          ③ 需要代理的 API 调用（路径规划、POI 搜索等）
                     │
┌────────────────────▼────────────────────────────────────┐
│                  do-sg VPS（新加坡）                      │
│              Caddy（HTTPS 终结 + 反代）                   │
│                        │                                 │
│              ┌─────────▼──────────┐                     │
│              │   Hono BFF Server  │                     │
│              │  (Node · pnpm 管理) │                     │
│              │                    │                     │
│              │ · 注入 securityJsCode│                    │
│              │ · 代理高德 Web API   │                     │
│              │ · 读写 houses.json  │                     │
│              └─────────┬──────────┘                     │
└────────────────────────┼────────────────────────────────┘
                         │
          ④ 转发至高德服务（加密 key）
                         │
┌────────────────────────▼────────────────────────────────┐
│                   高德地图 API                            │
│    路径规划 · POI 周边搜索 · 地理编码 · 到达圈             │
└─────────────────────────────────────────────────────────┘
```

### 请求链路说明

| 步骤 | 描述 |
|------|------|
| ① | 浏览器从 TOS 拉取 Vite build 产物，国内 CDN 节点响应，延迟低 |
| ② | 地图底图渲染由高德 JS SDK 直接走高德 CDN，不经过 do-sg |
| ③ | 需要隐藏 `securityJsCode` 的 API（Web Service 类）走 Hono 代理 |
| ④ | Hono 在服务端拼接完整鉴权参数后，转发至高德，返回结果给前端 |

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vite + React | SPA，pnpm 管理，build 产物上传 TOS |
| 后端 | Hono (Node) | BFF，仅做 API 代理 + 数据读写 |
| 静态托管 | 火山引擎 TOS | 静态网站托管，自定义域名 |
| 地图 | 高德地图 JS API 2.0 | 前端直接引入，WebGL 渲染 |
| 反代 | Caddy | do-sg 上已有，HTTPS + 反代 Hono 端口 |
| 数据存储 | `houses.json`（MVP） | 存于 do-sg 本地，Hono 直接读写 |
| 包管理 | pnpm workspace | 前后端 monorepo |

---

## 三、项目结构

```
rent-map/
├── packages/
│   ├── frontend/                  # Vite + React
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── MapView.tsx    # 高德地图主视图
│   │   │   │   ├── HouseCard.tsx  # 房源卡片
│   │   │   │   └── FilterBar.tsx  # 筛选栏
│   │   │   ├── api/
│   │   │   │   └── proxy.ts      # 调用 Hono BFF 的封装
│   │   │   └── main.tsx
│   │   └── vite.config.ts
│   │
│   └── server/                    # Hono BFF
│       ├── src/
│       │   ├── index.ts           # 入口，挂载路由
│       │   └── routes/
│       │       ├── amap.ts        # 高德 API 代理路由
│       │       └── houses.ts     # 房源 CRUD 路由
│       └── tsconfig.json
│
├── data/
│   └── houses.json                # MVP 数据层
│
├── pnpm-workspace.yaml
└── package.json
```

---

## 四、火山引擎 TOS 配置步骤

### 4.1 创建存储桶

1. 控制台 → 对象存储 TOS → 创建存储桶
2. 地域选**华北2（北京）**或**华东2（上海）**，国内访问更快
3. 访问权限设为**公共读**（静态网站需要）

### 4.2 开启静态网站托管

```
控制台 → 存储桶 → 基础配置 → 静态网站
  首页：index.html
  404 页：index.html（SPA 路由需要，防止刷新 404）
```

### 4.3 绑定自定义域名

```
控制台 → 存储桶 → 域名管理 → 自定义域名
  → 填写你的域名（如 rent.yourdomain.com）
  → TOS 会给出一个 CNAME 记录值
  → 到 DNS 服务商添加 CNAME 解析
```

> ⚠️ 注意：自定义域名在国内使用需要域名备案。如果域名未备案，TOS 会拒绝绑定国内节点。

### 4.4 配置 CORS（跨域）

由于前端静态资源在 TOS，但 API 调用会打到 do-sg 的 Hono，需要在 TOS 的 **CORS 配置**里允许 Hono 的域名；同时 Hono 端也要加 `Access-Control-Allow-Origin` 响应头。

```json
// TOS CORS 规则示例
{
  "AllowedOrigins": ["https://rent.yourdomain.com"],
  "AllowedMethods": ["GET", "POST"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

### 4.5 部署方式（每次更新）

```bash
# build 前端
pnpm --filter frontend build

# 用 tosutil（火山引擎官方 CLI）同步到 TOS
tosutil cp -r ./packages/frontend/dist/ tos://your-bucket-name/ -e your-endpoint
```

也可以配成 GitHub Actions，push 后自动 build + 上传。

---

## 五、高德 API Key 配置

高德 JS API 2.0 需要两个凭证：

| 凭证 | 放在哪里 | 说明 |
|------|----------|------|
| `key` | 前端（环境变量） | 可暴露，需在高德控制台绑定域名白名单 |
| `securityJsCode` | 后端 Hono（环境变量） | 不能暴露，通过代理注入 |

### 高德控制台配置
1. 创建 Web 端（JS API）应用
2. 域名白名单填 `rent.yourdomain.com`，防止 key 被滥用
3. 记录 `key` 和 `securityJsCode`

### Hono 代理实现思路

```ts
// server/src/routes/amap.ts
app.get('/api/amap/*', async (c) => {
  const path = c.req.path.replace('/api/amap', '')
  const url = new URL(`https://restapi.amap.com${path}`)

  // 注入鉴权参数
  url.searchParams.set('key', process.env.AMAP_KEY!)

  const res = await fetch(url.toString())
  return c.json(await res.json())
})
```

---

## 六、Caddy 配置

在 do-sg 的 `Caddyfile` 中新增一个站点块：

```caddyfile
api.yourdomain.com {
    reverse_proxy localhost:3001  # Hono 监听端口
}
```

---

## 七、MVP 功能范围

| 功能 | 优先级 | 所用高德 API |
|------|--------|-------------|
| 地图上展示所有房源 pin | P0 | JS API（Marker） |
| 点击 pin 展示房源详情卡片 | P0 | 无 |
| 输入工作地点，显示到各房源的通勤时间 | P0 | 路径规划（公交/步行） |
| 公交到达圈（X 分钟内可达范围） | P1 | ArrivalRange |
| 周边 POI 搜索（超市 / 地铁站 / 医院） | P1 | PlaceSearch.searchNearBy |
| 房源增删改（简单表单） | P1 | 无（Hono + JSON） |
| 地理编码（输入地址自动定位） | P1 | Geocoder |

---

## 八、后续可扩展方向

- 数据层从 `houses.json` 迁移到 SQLite（`better-sqlite3`），无需换框架
- 增加图片/视频上传，直接传到 TOS，前端展示
- 支持多个「目标地点」（公司 + 商圈），同时计算到达时间
- 离线缓存（PWA），手机看房时无网也能查

---

*文档版本：MVP v0.1 · 待 PRD 确认后进入开发*

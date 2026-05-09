# 租房对比地图工具 — 架构方案

> 文档版本：v0.4 MVP · 技术栈：Vite + React / Hono / 火山引擎 TOS / 高德地图 JS API

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
│  ├─ 使用 Web Service 凭证 │
│  ├─ 代理高德 API    │
│  └─ 读写 properties.json│
└──────────┬──────────┘
           │
  ④ 转发至高德（含加密 key）
           │
┌──────────▼──────────────────────────────────────────────┐
│                   高德地图 API                            │
│    路径规划 · POI 周边搜索 · 地理编码 · 到达圈             │
└─────────────────────────────────────────────────────────┘
```

### 请求链路说明

| 步骤 | 描述 |
|------|------|
| ① 静态资源 | 浏览器从 TOS Endpoint 拉取前端 build 产物，国内 CDN 节点响应 |
| ② API 调用 | 浏览器请求 `rent.leonardo-zhu.me`，Caddy 反代至 Hono；跨域，Hono 需加 CORS 头 |
| ③ 媒体文件 | 图片 / 视频存于 TOS `media/` 目录，`properties.json` 里记录直链，浏览器直接拉取 |
| ④ 高德代理 | Hono 使用服务端 Web Service 凭证转发高德 API 请求 |

> TOS 使用自带 Endpoint URL，**不绑定自定义域名**，无备案要求。SPA 路由通过 TOS 静态网站托管的「默认 404 → index.html」配置支持。

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vite + React | SPA，pnpm 管理 |
| 后端 | Hono (Node) | BFF，API 代理 + 房源数据读写 |
| 静态托管 | 火山引擎 TOS | 前端 build 产物 + 媒体文件，国内 CDN |
| 地图 | 高德地图 JS API 2.0 | 前端引入，WebGL 渲染 |
| 反代 | Caddy | HTTPS 终结，`rent.leonardo-zhu.me` → Hono |
| 数据存储 | `properties.json` + `targets.json` + `settings.json`（MVP） | 存于 do-sg，Hono 直接读写 |
| 包管理 | pnpm workspace | 前后端 monorepo |
| CI/CD | GitHub Actions | push 触发：build → 上传 TOS + 重启 Hono |

---

## 三、项目结构

```
nest-decider/
├── packages/
│   ├── frontend/                  # Vite + React
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── MapView.tsx    # 高德地图主视图
│   │   │   │   ├── HouseCard.tsx  # 房源卡片（含图片/视频）
│   │   │   │   └── FilterBar.tsx  # 筛选栏
│   │   │   ├── api/
│   │   │   │   └── client.ts      # axios 封装（baseURL 指向 rent.leonardo-zhu.me/api）
│   │   │   └── main.tsx
│   │   └── vite.config.ts
│   │
│   └── server/                    # Hono BFF
│       ├── src/
│       │   ├── index.ts           # 入口，挂载路由
│       │   └── routes/
│       │       ├── amap.ts        # 高德 API 代理路由
│       │       ├── property.ts    # 房源 CRUD 路由
│       │       └── llm.ts         # LLM 对房源评估 路由
│       └── tsconfig.json
│
├── data/
│   ├── properties.json            # 房源元数据
│   ├── targets.json               # 固定目标地点列表
│   └── settings.json              # 当前激活目标等全局设置
│
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions 部署
│
├── pnpm-workspace.yaml
└── package.json
```

---

## 四、房源数据结构（`properties.json`）

```json
[
  {
    "id": "001",
    "name": "朝阳某小区 2室1厅",
    "address": "北京市朝阳区xxx路xx号",
    "price": 4500,
    "area": 68,
    "floor": "6/18",
    "orientation": "南",
    "lat": 39.921,
    "lng": 116.441,
    "status": "待看",
    "note": "中介费半月",
    "mediaUrls": [
      "https://your-bucket.tos-cn-beijing.volces.com/house-001/cover.jpg",
      "https://your-bucket.tos-cn-beijing.volces.com/house-001/tour.mp4"
    ]
  }
]
```

媒体文件上传到 TOS 后，将 TOS Endpoint URL 填入 `mediaUrls`，前端直接渲染。

---

## 五、火山引擎 TOS 配置

TOS 一个桶承担两个职责，用目录区分：

```
your-bucket/
├── dist/      # 前端静态资源（index.html、JS、CSS）
└── media/     # 房源图片 / 视频
```

### 5.1 创建存储桶

1. 控制台 → 对象存储 TOS → 创建存储桶
2. 地域选**华北2（北京）**或**华东2（上海）**
3. 访问权限设为**公共读**

### 5.2 开启静态网站托管

```
控制台 → 存储桶 → 基础配置 → 静态网站
  首页文档：dist/index.html
  错误文档：dist/index.html   ← SPA 路由必须，防止刷新 404
```

访问入口为 TOS 自动生成的 Endpoint URL，形如：
```
https://your-bucket.tos-cn-beijing.volces.com/dist/index.html
```

### 5.3 上传媒体文件

使用控制台手动上传，或用 `tosutil` CLI：

```bash
tosutil cp ./video.mp4 tos://your-bucket/media/house-001/tour.mp4 \
  -e tos-cn-beijing.volces.com
```

上传后复制文件访问 URL，填入对应房源的 `mediaUrls`。

### 5.4 CORS 配置

浏览器从 TOS 加载媒体文件，以及调用 `rent.leonardo-zhu.me` 时均涉及跨域，需在 TOS 桶配置 CORS：

```json
{
  "AllowedOrigins": ["https://your-bucket.tos-cn-beijing.volces.com"],
  "AllowedMethods": ["GET"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

Hono 服务端也需加 CORS 中间件，允许来自 TOS Endpoint 的跨域请求。前端 `client.ts` 需显式设置 API baseURL 为 `https://rent.leonardo-zhu.me/api`，避免请求误发到 TOS 域名：

```ts
import { cors } from 'hono/cors'
app.use('/api/*', cors({
  origin: 'https://your-bucket.tos-cn-beijing.volces.com'
}))
```

---

## 六、高德 API Key 配置

| 凭证 | 放在哪里 | 说明 |
|------|----------|------|
| `key` | 前端环境变量 `VITE_AMAP_KEY` | 用于前端高德 JS API，可暴露，高德控制台绑定域名白名单 |
| `securityJsCode` | 前端运行时配置 | 与 JS API 配合进行安全校验，不在业务接口中透传 |
| `AMAP_WEB_KEY` | 服务端环境变量 | 用于 Hono 代理调用高德 Web Service API（路径规划 / 地理编码 / POI） |
| `AMAP_WEB_SIG`（可选） | 服务端环境变量 | 如启用 Web Service 数字签名，则由服务端计算并附加 `sig` 参数 |

高德控制台域名白名单填 `rent.leonardo-zhu.me`。

说明：
- 前端只使用 JS API 相关凭证（`key` + `securityJsCode`）。
- 后端只使用 Web Service 凭证（`AMAP_WEB_KEY`，以及可选 `AMAP_WEB_SIG`）。
- 前端展示通勤时间时仅使用单一总耗时；后端可返回方案明细但前端不强制展示。

### Hono 代理实现思路

```ts
// server/src/routes/amap.ts
app.get('/api/amap/*', async (c) => {
  const path = c.req.path.replace('/api/amap', '')
  const url = new URL(`https://restapi.amap.com${path}`)
  url.searchParams.set('key', process.env.AMAP_WEB_KEY!)
  // 如果启用 Web Service 数字签名，由服务端生成并附加
  // url.searchParams.set('sig', buildAmapSig(url, process.env.AMAP_WEB_SIG!))
  const res = await fetch(url.toString())
  return c.json(await res.json())
})
```

---

## 七、Caddy 配置

静态文件已由 TOS 托管，Caddy 只需反代 API：

```caddyfile
rent.leonardo-zhu.me {
    reverse_proxy localhost:3001
}
```

---

## 八、GitHub Actions 自动部署

push 到 `main` 后自动触发：build 前端 → 上传 TOS → 重启 Hono。

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Build frontend
        run: pnpm --filter frontend build
        env:
          VITE_AMAP_KEY: ${{ secrets.VITE_AMAP_KEY }}

      # TOS 兼容 S3 协议，直接用 AWS CLI 上传
      - name: Upload dist to TOS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.TOS_ACCESS_KEY }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.TOS_SECRET_KEY }}
        run: |
          aws s3 sync packages/frontend/dist/ \
            s3://${{ secrets.TOS_BUCKET }}/dist/ \
            --endpoint-url https://tos-cn-beijing.volces.com \
            --delete

      - name: Restart Hono server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DO_SG_HOST }}
          username: deployer
          key: ${{ secrets.DO_SG_SSH_KEY }}
          script: |
            cd ~/rent-map
            git pull origin main
            pnpm install --filter server
            pm2 restart rent-map-server
```

**需要在 GitHub Secrets 中配置：**

| Secret | 说明 |
|--------|------|
| `TOS_ACCESS_KEY` | 火山引擎 Access Key |
| `TOS_SECRET_KEY` | 火山引擎 Secret Key |
| `TOS_BUCKET` | TOS 桶名 |
| `DO_SG_HOST` | do-sg 服务器 IP |
| `DO_SG_SSH_KEY` | deployer 用户的 SSH 私钥 |
| `VITE_AMAP_KEY` | 高德 JS API key（前端用） |
| `AMAP_WEB_KEY` | 高德 Web Service key（pm2 环境变量注入） |
| `AMAP_WEB_SIG` | 高德 Web Service 数字签名密钥（可选，pm2 环境变量注入） |

---

## 九、MVP 功能范围

| 功能 | 优先级 | 所用高德 API |
|------|--------|-------------|
| 地图上展示所有房源 pin | P0 | JS API（Marker） |
| 点击 pin 展示详情卡片（含图片/视频） | P0 | 无 |
| 输入工作地点，显示各房源通勤时间 | P0 | 路径规划（公共交通，默认地铁优先；总耗时含步行接驳） |
| 公共交通到达圈（X 分钟内可达范围） | P1 | ArrivalRange |
| 周边 POI 搜索（超市 / 地铁站 / 医院） | P1 | PlaceSearch.searchNearBy |
| 房源增删改（简单表单） | P0 | 无（Hono + JSON） |
| 地理编码（输入地址自动定位） | P1 | Geocoder |

---

## 十、后续可扩展方向

- 数据层从 `properties.json` 迁移到 SQLite（`better-sqlite3`），无需换框架
- 前端直传媒体文件到 TOS（TOS 预签名 URL 方案，无需经过 do-sg）
- 支持多个「目标地点」（公司 + 商圈），同时计算到达时间
- 离线缓存（PWA），手机看房时无网也能查历史数据

---

*文档版本：Architecture v0.4 · 已与 PRD v0.2 对齐*

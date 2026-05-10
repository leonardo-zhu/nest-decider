# 租房对比地图工具 - 架构方案

> 文档版本：v0.3 MVP · 技术栈：Vite + React / Hono / 火山引擎 TOS / 高德地图 JS API

---

## 一、整体架构

```
┌──────────────────────────────────────────────────────┐
│                      用户浏览器                       │
│                PC / iPhone Safari                    │
└───────────────┬───────────────────────┬──────────────┘
                │                       │
        ① 静态资源                     ② API 请求
                │                       │
┌───────────────▼──────────────┐   ┌────▼──────────────────┐
│        火山引擎 TOS          │   │       do-sg VPS       │
│  前端 build 产物 / 外部媒体直链 │   │  Caddy -> Hono API    │
└───────────────────────────────┘   │  房源 / 目标 CRUD      │
                                    │  JSON 数据读写         │
                                    └───────────────────────┘

前端直接加载高德地图 JS API，地图、通勤展示和相关交互都在浏览器完成。
```

### 请求链路

| 步骤 | 描述 |
|------|------|
| ① 静态资源 | 浏览器从 TOS 拉取前端 build 产物 |
| ② API 调用 | 浏览器请求 `rent.leonardo-zhu.me`，Caddy 反代到 Hono |
| ③ 媒体展示 | `mediaUrls` 里的图片 / 视频由浏览器直接访问外部直链 |
| ④ 地图能力 | 浏览器加载高德地图 JS API，前端完成地图渲染与交互 |

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vite + React | 单页应用 |
| 后端 | Hono (Node) | 仅提供业务 CRUD API |
| 静态托管 | 火山引擎 TOS | 前端 build 产物 |
| 媒体存储 | 火山引擎 TOS | 外部上传后得到直链，写入 `mediaUrls` |
| 地图 | 高德地图 JS API 2.0 | 前端直接加载 |
| 反代 | Caddy | HTTPS 终结，转发到 Hono |
| 数据存储 | `properties.json` + `targets.json` + `settings.json` | 存于 `DEPLOY_PATH/shared/data`（独立于 releases），后端直接读写 |
| 包管理 | pnpm workspace | 前后端 monorepo |

---

## 三、项目结构

```
nest-decider/
├── packages/
│   ├── frontend/
│   │   └── src/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── ...
│   └── server/
│       └── src/
│           ├── routes/
│           ├── domains/
│           ├── core/
│           └── index.ts
├── shared/data/  (部署机运行时目录，不在仓库内)
│   ├── properties.json
│   ├── targets.json
│   └── settings.json
└── pnpm-workspace.yaml
```

---

## 四、后端职责

后端当前只负责：

- 房源 CRUD（前端单表单提交）
- 目标地点 CRUD
- 激活目标地点设置
- 读取和写入 `DATA_DIR` 指向的 JSON 数据文件（默认部署为 `shared/data`）

后端不负责：

- 高德 WebService 代理
- 媒体上传 / 删除
- AI 评估
- 通勤路线计算

---

## 五、当前 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/properties` | GET/POST | 房源列表 / 新建 |
| `/api/properties/:id` | GET/PUT/DELETE | 房源详情 / 更新 / 删除 |
| `/api/targets` | GET/POST | 目标地点列表 / 新建 |
| `/api/targets/:id` | PUT/DELETE | 目标地点更新 / 删除 |
| `/api/targets/active/:id` | PUT | 激活目标地点 |
| `/api/targets/active` | PUT | 设置或清空激活目标 |

说明：
- 现阶段没有 `/api/media`、`/api/amap/*`、`/api/ai/*` 等路由
- `commuteCache` 是房源数据的一部分，但不代表后端提供了独立通勤服务接口

---

## 六、前端职责

前端负责：

- 加载高德地图 JS API
- 渲染地图、房源 pin 和列表
- 展示房源详情
- 直接播放 `mediaUrls` 中的视频和图片
- 根据目标地点展示前端计算或前端维护的通勤信息

前端不依赖后端去做高德请求转发。

---

## 七、环境变量

主要变量：

- 服务：`PORT`, `CORS_ORIGIN`
- 地图前端：`VITE_AMAP_KEY`, `VITE_AMAP_JSCODE`
- 数据目录：`DATA_DIR`（部署脚本默认注入为 `$DEPLOY_PATH/shared/data`）

当前文档不再把高德 WebService、TOS 预签名、AI 评估相关变量视为必需项。

---

## 八、数据口径

- `mediaUrls`：外部上传后得到的图片 / 视频直链
- `commuteCache`：房源上的通勤缓存字段，当前仅作为数据结构存在
- 详情页：直接展示 `mediaUrls`
- 高德能力：由前端 JSAPI 处理

---

## 九、未来规划

以下内容当前不应视为已实现，后续如补齐再单独落文档：

- P1：更完整的通勤分析
- P1：周边 POI 查询
- P1：到达圈
- P1：多目标地点
- P1：AI 房源评估

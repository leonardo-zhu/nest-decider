# 租房对比地图工具 - PRD

> 版本：v0.3 MVP · 个人工具，单用户

---

## 一、产品目标

这是一个个人租房决策工具，用地图 + 列表的方式管理少量房源，帮助在看房期快速记录、对比和筛选。

当前实现重点：
- 后端只负责房源和目标地点的 CRUD
- 高德地图能力由前端 JSAPI 直接处理
- 媒体文件先上传到 TOS，再把外部直链粘贴到 `mediaUrls`
- 详情页直接展示 `mediaUrls`

---

## 二、使用场景

| 项目 | 说明 |
|------|------|
| 用户 | 单用户个人工具 |
| 使用设备 | iPhone / MacBook |
| 房源规模 | 小规模管理，通常不超过 10 套 |
| 使用周期 | 租房决策周期内使用 |

---

## 三、核心流程

### 3.1 添加房源

1. 新建房源，填写名称、地址、坐标和基础信息
2. 在同一表单中填写可用信息并保存；后续可再次编辑补充字段
3. 若有视频或图片，先上传到外部 TOS
4. 将得到的文件直链粘贴到 `mediaUrls`

### 3.2 管理目标地点

1. 新建目标地点，例如公司地址
2. 设为当前激活目标
3. 前端使用高德 JSAPI 计算和展示通勤相关信息

### 3.3 查看房源详情

1. 从地图 pin 或列表打开详情
2. 查看基础信息、费用、备注和 `mediaUrls`
3. 需要时编辑或删除房源

---

## 四、页面与交互

### 4.1 主界面

- PC 端采用地图 + 列表的双栏布局
- 移动端采用列表 / 地图切换
- 选择房源后，地图和列表同步高亮

### 4.2 地图能力

- 地图由高德地图 JS API 在前端加载
- 地图上展示房源 pin
- 当前激活目标会参与通勤展示
- 到达圈、路线、POI 查询属于前端能力规划，未作为后端职责

### 4.3 房源详情

- 展示基础信息、费用、备注
- `mediaUrls` 中的图片直接展示
- `mediaUrls` 中的视频直接播放
- 保留编辑和删除入口

### 4.4 新增 / 编辑房源（单表单）

字段重点如下：

| 字段 | 说明 |
|------|------|
| 名称 | 房源名称 |
| 地址 | 文本地址 |
| 坐标 | 经纬度 |
| 状态 | 待看 / 已看 / 排除 |
| 租金 | 月租 |
| 面积 | 平方米 |
| 楼层 | 可选 |
| 朝向 | 可选 |
| 装修 | 可选 |
| 燃气 / 车位 / 阳台 | 可选 |
| 备注 | 自由文本 |
| `mediaUrls` | 外部上传后得到的图片 / 视频直链 |

---

## 五、功能范围

### 5.1 已实现

- 房源 CRUD
- 目标地点 CRUD
- 激活目标地点设置
- 前端通过高德 JSAPI 进行地图展示
- 房源详情展示 `mediaUrls`
- 列表与详情中的基础字段展示

### 5.2 未来规划

以下内容目前不应视为已实现，只作为后续规划：

- P1：更完整的通勤分析展示
- P1：周边 POI 深度查询
- P1：到达圈可视化
- P1：多目标地点切换
- P1：AI 房源评估

---

## 六、数据模型

```ts
interface Property {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  status: 'pending' | 'viewed' | 'excluded'
  price?: number
  propertyType?: 'residential' | 'urban-village' | 'standalone-urban' | 'standalone'
  roomType?: 'studio' | 'large-studio' | '1b1l' | '2b1l' | 'loft'
  area?: number
  floor?: string
  orientation?: string
  decoration?: 'luxury' | 'simple'
  hasGas?: boolean
  gasFee?: number
  electricityFee?: number
  waterFee?: number
  managementFee?: number
  network?: 'included' | 'self' | 'unavailable'
  networkNote?: string
  fridge?: string
  hasBalcony?: boolean
  parking?: 'available' | 'unavailable'
  parkingNote?: string
  note?: string
  pricePerSqm?: number
  mediaUrls: string[]
  commuteCache?: {
    targetId: string
    minutes: number
    mode: 'transit'
    updatedAt: string
  }[]
  createdAt: string
  updatedAt: string
}

interface Target {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  createdAt: string
  updatedAt: string
}
```

---

## 七、非目标

当前版本不包含：

- 后端高德 WebService 代理
- 后端媒体预签名上传 / 删除
- 后端 AI 评估路由
- 媒体文件托管到后端

这些能力如果后续补齐，再单独升级为 P1 规划或实现项。


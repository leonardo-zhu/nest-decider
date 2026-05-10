import type { Property, PropertyStatus } from './types'

export function getCommuteMinutes(property: Property, targetId: string, tempQuery?: { propertyId: string; minutes: number }[] | null): number | null {
  if (tempQuery) {
    const match = tempQuery.find(r => r.propertyId === property.id)
    if (match) return match.minutes
  }
  const cache = property.commuteCache?.find(c => c.targetId === targetId)
  return cache?.minutes ?? null
}

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  pending: '待看',
  viewed: '已看',
  excluded: '排除',
}

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  pending: '#e67e22',
  viewed: '#27ae60',
  excluded: '#95a5a6',
}

export const ROOM_TYPE_LABELS: Record<string, string> = {
  studio: '单间',
  'large-studio': '大单间',
  '1b1l': '一房一厅',
  '2b1l': '二房一厅',
  loft: 'Loft',
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: '小区房',
  'urban-village': '城中村',
  'standalone-urban': '独栋公寓（城中村）',
  standalone: '独栋公寓（非城中村）',
}

export const ORIENTATION_OPTIONS = ['南', '北', '东', '西', '东南', '西南', '东北', '西北', '其他']

export const DEORATION_LABELS: Record<string, string> = {
  luxury: '精装',
  simple: '简装',
}

export function formatPrice(price?: number): string {
  if (price == null) return '-'
  return `¥${price.toLocaleString()}/月`
}

export function formatArea(area?: number): string {
  if (area == null) return '-'
  return `${area}m²`
}

export function formatPricePerSqm(property: Property): string {
  if (property.pricePerSqm != null) return `${property.pricePerSqm.toFixed(1)}元/m²`
  if (property.price && property.area) return `${(property.price / property.area).toFixed(1)}元/m²`
  return '-'
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

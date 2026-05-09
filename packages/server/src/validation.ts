import { fail } from './errors.js'
import type { IntakeStage, Property, PropertyStatus, Settings, Target } from './types.js'

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.length > 0)
}

function isStatus(value: unknown): value is PropertyStatus {
  return value === 'pending' || value === 'viewed' || value === 'excluded'
}

function withPricePerSqm(input: Omit<Property, 'pricePerSqm'>): Property {
  const hasValidArea = typeof input.area === 'number' && input.area > 0
  const hasValidPrice = typeof input.price === 'number' && input.price >= 0
  const pricePerSqm = hasValidArea && hasValidPrice ? Number((input.price! / input.area!).toFixed(2)) : undefined

  return {
    ...input,
    pricePerSqm,
  }
}

export function sanitizePropertyCreate(payload: unknown, nowIso: string): { ok: true; value: Property } | { ok: false; error: string } {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, error: 'invalid payload' }
  }

  const row = payload as Record<string, unknown>
  const id = asString(row.id)
  const name = asString(row.name)
  const address = asString(row.address)
  const lat = asNumber(row.lat)
  const lng = asNumber(row.lng)

  if (!id || !name || !address || lat === undefined || lng === undefined) {
    return { ok: false, error: 'id/name/address/lat/lng are required' }
  }

  const status = isStatus(row.status) ? row.status : 'pending'

  const value = withPricePerSqm({
    id,
    name,
    address,
    lat,
    lng,
    status,
    price: asNumber(row.price),
    propertyType: asString(row.propertyType) as Property['propertyType'],
    roomType: asString(row.roomType) as Property['roomType'],
    area: asNumber(row.area),
    floor: asString(row.floor),
    orientation: asString(row.orientation),
    decoration: asString(row.decoration) as Property['decoration'],
    hasGas: asBoolean(row.hasGas),
    gasFee: asNumber(row.gasFee),
    electricityFee: asNumber(row.electricityFee),
    waterFee: asNumber(row.waterFee),
    managementFee: asNumber(row.managementFee),
    network: asString(row.network) as Property['network'],
    networkNote: asString(row.networkNote),
    fridge: asString(row.fridge),
    hasBalcony: asBoolean(row.hasBalcony),
    parking: asString(row.parking) as Property['parking'],
    parkingNote: asString(row.parkingNote),
    note: asString(row.note),
    mediaUrls: asStringArray(row.mediaUrls),
    commuteCache: Array.isArray(row.commuteCache) ? (row.commuteCache as Property['commuteCache']) : [],
    createdAt: asString(row.createdAt) ?? nowIso,
    updatedAt: nowIso,
  })

  return { ok: true, value }
}

export function sanitizePropertyPatch(existing: Property, payload: unknown, nowIso: string): { ok: true; value: Property } | { ok: false; error: string } {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, error: 'invalid payload' }
  }

  const row = payload as Record<string, unknown>
  const merged: Omit<Property, 'pricePerSqm'> = {
    ...existing,
    ...('name' in row ? { name: asString(row.name) ?? existing.name } : {}),
    ...('address' in row ? { address: asString(row.address) ?? existing.address } : {}),
    ...('lat' in row ? { lat: asNumber(row.lat) ?? existing.lat } : {}),
    ...('lng' in row ? { lng: asNumber(row.lng) ?? existing.lng } : {}),
    ...('status' in row && isStatus(row.status) ? { status: row.status } : {}),
    ...('price' in row ? { price: asNumber(row.price) } : {}),
    ...('propertyType' in row ? { propertyType: asString(row.propertyType) as Property['propertyType'] } : {}),
    ...('roomType' in row ? { roomType: asString(row.roomType) as Property['roomType'] } : {}),
    ...('area' in row ? { area: asNumber(row.area) } : {}),
    ...('floor' in row ? { floor: asString(row.floor) } : {}),
    ...('orientation' in row ? { orientation: asString(row.orientation) } : {}),
    ...('decoration' in row ? { decoration: asString(row.decoration) as Property['decoration'] } : {}),
    ...('hasGas' in row ? { hasGas: asBoolean(row.hasGas) } : {}),
    ...('gasFee' in row ? { gasFee: asNumber(row.gasFee) } : {}),
    ...('electricityFee' in row ? { electricityFee: asNumber(row.electricityFee) } : {}),
    ...('waterFee' in row ? { waterFee: asNumber(row.waterFee) } : {}),
    ...('managementFee' in row ? { managementFee: asNumber(row.managementFee) } : {}),
    ...('network' in row ? { network: asString(row.network) as Property['network'] } : {}),
    ...('networkNote' in row ? { networkNote: asString(row.networkNote) } : {}),
    ...('fridge' in row ? { fridge: asString(row.fridge) } : {}),
    ...('hasBalcony' in row ? { hasBalcony: asBoolean(row.hasBalcony) } : {}),
    ...('parking' in row ? { parking: asString(row.parking) as Property['parking'] } : {}),
    ...('parkingNote' in row ? { parkingNote: asString(row.parkingNote) } : {}),
    ...('note' in row ? { note: asString(row.note) } : {}),
    ...('mediaUrls' in row ? { mediaUrls: asStringArray(row.mediaUrls) } : {}),
    ...('commuteCache' in row && Array.isArray(row.commuteCache)
      ? { commuteCache: row.commuteCache as Property['commuteCache'] }
      : {}),
    createdAt: existing.createdAt,
    updatedAt: nowIso,
  }

  return { ok: true, value: withPricePerSqm(merged) }
}

function validateStage1Rules(row: Property): void {
  if (!row.name || !row.address || row.lat === undefined || row.lng === undefined) {
    fail(400, 'STAGE1_REQUIRED_MISSING', 'stage1 requires name/address/lat/lng')
  }
}

function validateStage2Rules(row: Property): void {
  if (row.price === undefined || row.area === undefined || !row.floor || !row.orientation || !row.decoration) {
    fail(400, 'STAGE2_REQUIRED_MISSING', 'stage2 requires price/area/floor/orientation/decoration')
  }
}

export function validateIntakeStage(row: Property, stage?: IntakeStage): void {
  if (!stage) return
  if (stage === 'stage1') {
    validateStage1Rules(row)
    return
  }
  validateStage1Rules(row)
  validateStage2Rules(row)
}

export function sanitizeTargetCreate(payload: unknown, nowIso: string): { ok: true; value: Target } | { ok: false; error: string } {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, error: 'invalid payload' }
  }

  const row = payload as Record<string, unknown>
  const id = asString(row.id)
  const name = asString(row.name)
  const address = asString(row.address)
  const lat = asNumber(row.lat)
  const lng = asNumber(row.lng)

  if (!id || !name || !address || lat === undefined || lng === undefined) {
    return { ok: false, error: 'id/name/address/lat/lng are required' }
  }

  return {
    ok: true,
    value: {
      id,
      name,
      address,
      lat,
      lng,
      createdAt: asString(row.createdAt) ?? nowIso,
      updatedAt: nowIso,
    },
  }
}

export function sanitizeSettings(payload: unknown): { ok: true; value: Settings } | { ok: false; error: string } {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, error: 'invalid payload' }
  }

  const row = payload as Record<string, unknown>
  return {
    ok: true,
    value: {
      activeTargetId: typeof row.activeTargetId === 'string' ? row.activeTargetId : null,
    },
  }
}

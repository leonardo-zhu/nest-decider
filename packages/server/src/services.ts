import { env } from './env.js'
import { fail } from './errors.js'
import { arrivalRange, nearbyPoi, transitRoute } from './amap-client.js'
import { store } from './store.js'
import type { CommuteCacheItem, Property, Target } from './types.js'

function ensureTarget(rows: Target[], targetId: string): Target {
  const target = rows.find((item) => item.id === targetId)
  if (!target) {
    fail(404, 'TARGET_NOT_FOUND', 'target not found')
  }
  return target
}

function originOf(property: Property): string {
  return `${property.lng},${property.lat}`
}

function destinationOf(target: Target): string {
  return `${target.lng},${target.lat}`
}

function cityFromAddress(address: string): string {
  const first = address.split('市')[0]
  return first.length > 1 ? `${first}市` : '深圳市'
}

export async function computeTransitMinutes(property: Property, target: Target): Promise<number> {
  const res = await transitRoute(originOf(property), destinationOf(target), cityFromAddress(target.address))
  const route = res.route as { transits?: Array<{ duration?: string }> } | undefined
  const first = route?.transits?.[0]
  if (!first?.duration) {
    fail(502, 'AMAP_TRANSIT_EMPTY', 'no transit route found')
  }
  return Math.ceil(Number(first.duration) / 60)
}

function upsertCommuteCache(oldCache: CommuteCacheItem[] | undefined, targetId: string, minutes: number): CommuteCacheItem[] {
  const now = new Date().toISOString()
  const next = (oldCache ?? []).filter((item) => item.targetId !== targetId)
  next.push({ targetId, minutes, mode: 'transit', updatedAt: now })
  return next
}

export async function refreshFixedCommuteForAll() {
  const [rows, targets, settings] = await Promise.all([
    store.readProperties(),
    store.readTargets(),
    store.readSettings(),
  ])

  if (!settings.activeTargetId) {
    fail(400, 'ACTIVE_TARGET_MISSING', 'active target is not set')
  }

  const activeTarget = ensureTarget(targets, settings.activeTargetId)
  const updated: Property[] = []

  for (const row of rows) {
    const minutes = await computeTransitMinutes(row, activeTarget)
    updated.push({
      ...row,
      commuteCache: upsertCommuteCache(row.commuteCache, activeTarget.id, minutes),
      updatedAt: new Date().toISOString(),
    })
  }

  await store.writeProperties(updated)

  return {
    targetId: activeTarget.id,
    count: updated.length,
    results: updated.map((item) => ({
      propertyId: item.id,
      minutes: item.commuteCache?.find((cache) => cache.targetId === activeTarget.id)?.minutes ?? null,
    })),
  }
}

export async function queryTempCommute(target: Pick<Target, 'id' | 'name' | 'address' | 'lat' | 'lng'>) {
  const rows = await store.readProperties()
  const results: Array<{ propertyId: string; minutes: number }> = []

  for (const row of rows) {
    const minutes = await computeTransitMinutes(row, target as Target)
    results.push({ propertyId: row.id, minutes })
  }

  return {
    target,
    results,
  }
}

export async function getPoiByProperty(propertyId: string, category: 'subway' | 'market' | 'hospital') {
  const rows = await store.readProperties()
  const property = rows.find((item) => item.id === propertyId)
  if (!property) {
    fail(404, 'PROPERTY_NOT_FOUND', 'property not found')
  }

  const keywordMap: Record<typeof category, string> = {
    subway: '地铁站',
    market: '超市|便利店',
    hospital: '医院',
  }

  const location = `${property.lng},${property.lat}`
  const res = await nearbyPoi(location, keywordMap[category])
  const pois = (res.pois as Array<Record<string, unknown>> | undefined) ?? []

  return pois.map((poi) => ({
    id: poi.id,
    name: poi.name,
    location: poi.location,
    distance: poi.distance,
    address: poi.address,
    type: poi.type,
  }))
}

export async function getArrivalRange(minutes: number, targetId?: string) {
  const [targets, settings] = await Promise.all([store.readTargets(), store.readSettings()])
  const activeId = targetId ?? settings.activeTargetId
  if (!activeId) {
    fail(400, 'ACTIVE_TARGET_MISSING', 'active target is not set')
  }

  const target = ensureTarget(targets, activeId)
  const location = `${target.lng},${target.lat}`
  const res = await arrivalRange(location, minutes)

  return {
    target,
    minutes,
    bounds: res.bounds,
    polyline: res.polylines,
  }
}

export async function createMediaUploadPresign(params: {
  propertyId: string
  fileName: string
  contentType: string
}) {
  if (!env.tosBucket || !env.tosAccessKeyId || !env.tosSecretAccessKey || !env.tosEndpoint) {
    fail(500, 'TOS_CONFIG_MISSING', 'TOS credentials are not fully configured')
  }

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

  const client = new S3Client({
    region: env.tosRegion,
    endpoint: env.tosEndpoint,
    credentials: {
      accessKeyId: env.tosAccessKeyId,
      secretAccessKey: env.tosSecretAccessKey,
    },
    forcePathStyle: true,
  })

  const key = `media/${params.propertyId}/${Date.now()}-${params.fileName}`
  const command = new PutObjectCommand({
    Bucket: env.tosBucket,
    Key: key,
    ContentType: params.contentType,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 })
  return {
    key,
    uploadUrl,
    publicUrl: `${env.tosEndpoint.replace(/\/$/, '')}/${env.tosBucket}/${key}`,
    expiresIn: 600,
  }
}

export async function deleteMediaObject(key: string) {
  if (!env.tosBucket || !env.tosAccessKeyId || !env.tosSecretAccessKey || !env.tosEndpoint) {
    fail(500, 'TOS_CONFIG_MISSING', 'TOS credentials are not fully configured')
  }

  const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3')

  const client = new S3Client({
    region: env.tosRegion,
    endpoint: env.tosEndpoint,
    credentials: {
      accessKeyId: env.tosAccessKeyId,
      secretAccessKey: env.tosSecretAccessKey,
    },
    forcePathStyle: true,
  })

  await client.send(
    new DeleteObjectCommand({
      Bucket: env.tosBucket,
      Key: key,
    }),
  )

  return { deleted: true, key }
}

export async function evaluateWithLLM(input: {
  mode: 'single' | 'compare'
  propertyIds: string[]
  customPrompt?: string
}) {
  if (!env.aiApiKey) {
    fail(500, 'AI_KEY_MISSING', 'AI_API_KEY is not set')
  }

  const rows = await store.readProperties()
  const selected = rows.filter((item) => input.propertyIds.includes(item.id))
  if (selected.length === 0) {
    fail(400, 'NO_PROPERTIES_SELECTED', 'no valid properties selected')
  }

  const systemPrompt =
    '你是租房决策助手。请基于输入的结构化数据，输出可执行、具体、简洁的建议。重点比较通勤、租金、面积、燃气、水电、配套和风险点。'
  const userPrompt = input.customPrompt ?? '请给出最终建议，并说明理由与潜在风险。'

  const response = await fetch(`${env.aiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.aiApiKey}`,
    },
    body: JSON.stringify({
      model: env.aiModel,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: JSON.stringify({ mode: input.mode, properties: selected, question: userPrompt }, null, 2),
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    fail(502, 'AI_UPSTREAM_ERROR', `ai upstream failed: ${body.slice(0, 300)}`)
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    usage?: Record<string, unknown>
  }

  const content = json.choices?.[0]?.message?.content?.trim()
  if (!content) {
    fail(502, 'AI_EMPTY_RESPONSE', 'ai response is empty')
  }

  return {
    mode: input.mode,
    propertyIds: input.propertyIds,
    model: env.aiModel,
    result: content,
    usage: json.usage ?? null,
  }
}

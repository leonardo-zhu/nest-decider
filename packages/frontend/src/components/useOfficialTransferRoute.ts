import { useEffect, useRef, useState } from 'react'

interface DisplayTarget {
  id: string
  name: string
  address: string
  lng: number
  lat: number
}

interface TransitSegment {
  kind: 'walk' | 'bus' | 'subway' | 'railway' | 'other'
  label: string
  durationSeconds: number
  distanceMeters?: number
  stationCount?: number
}

export interface TransitPlanSummary {
  index: number
  durationSeconds: number
  walkingDistanceMeters: number
  costYuan?: number
  segments: TransitSegment[]
}

interface UseOfficialTransferRouteParams {
  map: AMap.Map | null
  selectedProperty?: { id: string; lng: number; lat: number }
  displayTarget?: DisplayTarget
  city?: string
}

interface TransferInstance {
  clear: () => void
  search: (o: AMap.LngLat, d: AMap.LngLat, cb: (status: string, result: Record<string, unknown>) => void) => void
}

function parseDuration(step: Record<string, unknown>): number {
  const v = step.time
  return typeof v === 'number' ? v : 0
}

function parseStationCount(obj: Record<string, unknown>): number | undefined {
  if (typeof obj.via_num === 'number') return obj.via_num
  if (typeof obj.station_num === 'number') return obj.station_num
  if (Array.isArray(obj.pass_stops)) return obj.pass_stops.length
  return undefined
}

function normalizeLineName(name: string): string {
  return name.replace(/\(.+?\)/g, '').replace(/\s+/g, '').trim()
}

function parseSegmentFromInstruction(seg: Record<string, unknown>): TransitSegment | null {
  const instruction = typeof seg.instruction === 'string' ? seg.instruction : ''
  const durationSeconds = parseDuration(seg)
  if (!instruction) return null

  if (instruction.includes('步行')) {
    const m = instruction.match(/步行(\d+)\s*米/)
    const distanceMeters = m ? Number(m[1]) : undefined
    return {
      kind: 'walk',
      label: `步行 ${distanceMeters != null ? `${distanceMeters}米` : ''}`.trim(),
      durationSeconds,
      distanceMeters,
    }
  }

  const lineMatch = instruction.match(/乘坐(.+?)(?:途径|到达|，|。|$)/)
  const stationMatch = instruction.match(/途径(\d+)站/)
  if (lineMatch) {
    const lineName = normalizeLineName(lineMatch[1])
    const stationCount = stationMatch ? Number(stationMatch[1]) : undefined
    const isSubway = /地铁|号线/.test(lineName)
    return {
      kind: isSubway ? 'subway' : 'bus',
      label: stationCount != null && stationCount > 0 ? `${lineName} · ${stationCount}站` : lineName,
      durationSeconds,
      stationCount,
    }
  }

  return null
}

function parsePlans(result: Record<string, unknown>): TransitPlanSummary[] {
  const plans = Array.isArray(result.plans) ? result.plans as Array<Record<string, unknown>> : []
  return plans.map((plan, idx) => {
    const segmentsRaw = Array.isArray(plan.segments) ? plan.segments as Array<Record<string, unknown>> : []
    const segments: TransitSegment[] = segmentsRaw
      .map(seg => {
        const fromInstruction = parseSegmentFromInstruction(seg)
        if (fromInstruction) return fromInstruction

        if (seg.walking && typeof seg.walking === 'object') {
          const walking = seg.walking as Record<string, unknown>
          const distanceMeters = typeof walking.distance === 'number' ? walking.distance : undefined
          return {
            kind: 'walk',
            label: `步行 ${distanceMeters != null ? `${Math.round(distanceMeters)}米` : ''}`.trim(),
            durationSeconds: parseDuration(walking),
            distanceMeters,
          }
        }
        if (seg.transit && typeof seg.transit === 'object') {
          const transit = seg.transit as Record<string, unknown>
          const busRaw = transit.bus && typeof transit.bus === 'object'
            ? transit.bus as Record<string, unknown>
            : undefined
          const buslines = busRaw && Array.isArray(busRaw.buslines)
            ? busRaw.buslines as Array<Record<string, unknown>>
            : []
          const busline = buslines[0]

          const railwayRaw = transit.railway && typeof transit.railway === 'object'
            ? transit.railway as Record<string, unknown>
            : undefined
          const railwayName = railwayRaw && typeof railwayRaw.name === 'string'
            ? railwayRaw.name
            : undefined

          const baseName =
            (busline && typeof busline.name === 'string' ? busline.name : undefined)
            ?? railwayName
            ?? (typeof transit.name === 'string' ? transit.name : '')

          const stationCount =
            (busline && typeof busline.via_num === 'number' ? busline.via_num : undefined)
            ?? parseStationCount(transit)
          const maybeMode = typeof transit.transit_mode === 'string' ? transit.transit_mode.toLowerCase() : ''
          const looksSubway = /地铁|号线/.test(baseName) || maybeMode.includes('subway')
          const normalizedName = normalizeLineName(baseName || (looksSubway ? '地铁线路' : '公交线路'))
          return {
            kind: looksSubway ? 'subway' : 'bus',
            label: stationCount != null && stationCount > 0 ? `${normalizedName} · ${stationCount}站` : normalizedName,
            durationSeconds: parseDuration(transit),
            stationCount,
          }
        }
        if (seg.railway && typeof seg.railway === 'object') {
          const railway = seg.railway as Record<string, unknown>
          return {
            kind: 'railway',
            label: (railway.name as string) || '铁路',
            durationSeconds: parseDuration(railway),
          }
        }
        return null
      })
      .filter((x): x is TransitSegment => Boolean(x))

    return {
      index: idx,
      durationSeconds: typeof plan.time === 'number' ? plan.time : 0,
      walkingDistanceMeters: typeof plan.walking_distance === 'number' ? plan.walking_distance : 0,
      costYuan: typeof plan.cost === 'number' ? plan.cost : undefined,
      segments,
    }
  })
}

export function useOfficialTransferRoute({
  map,
  selectedProperty,
  displayTarget,
  city,
}: UseOfficialTransferRouteParams) {
  const transferRef = useRef<TransferInstance | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [plans, setPlans] = useState<TransitPlanSummary[]>([])
  const [activePlanIndex, setActivePlanIndex] = useState(0)

  useEffect(() => {
    if (!map || !window.AMap || !selectedProperty || !displayTarget || !city) {
      transferRef.current?.clear()
      transferRef.current = null
      if (panelRef.current) panelRef.current.innerHTML = ''
      setPlans([])
      setActivePlanIndex(0)
      return
    }

    transferRef.current?.clear()
    transferRef.current = null
    if (panelRef.current) panelRef.current.innerHTML = ''

    const transfer = new window.AMap.Transfer({
      map,
      panel: panelRef.current ?? undefined,
      city,
      policy: 0,
      nightflag: 0,
      hideMarkers: false,
      autoFitView: true,
    }) as unknown as TransferInstance

    transferRef.current = transfer

    const origin = new window.AMap.LngLat(selectedProperty.lng, selectedProperty.lat)
    const destination = new window.AMap.LngLat(displayTarget.lng, displayTarget.lat)
    transfer.search(origin, destination, (status, result) => {
      if (status !== 'complete') {
        setPlans([])
        setActivePlanIndex(0)
        return
      }
      setPlans(parsePlans(result))
      setActivePlanIndex(0)
    })

    return () => {
      transferRef.current?.clear()
      transferRef.current = null
    }
  }, [map, selectedProperty?.id, selectedProperty?.lng, selectedProperty?.lat, displayTarget?.id, displayTarget?.lng, displayTarget?.lat, city])

  const clearRoute = () => {
    transferRef.current?.clear()
    transferRef.current = null
    if (panelRef.current) panelRef.current.innerHTML = ''
    setPlans([])
    setActivePlanIndex(0)
  }

  const selectPlan = (index: number) => {
    if (index < 0 || index >= plans.length) return
    setActivePlanIndex(index)
  }

  return { panelRef, clearRoute, plans, activePlanIndex, selectPlan }
}

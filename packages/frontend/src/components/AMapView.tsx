import { useEffect, useRef, useCallback, useState } from 'react'
import { useAMap } from './useAMap'
import { useAppContext } from '../AppContext'
import type { Property, Target, TempQueryResult } from '../types'
import { getCommuteMinutes, STATUS_COLORS } from '../utils'

interface AMapViewProps {
  properties: Property[]
  selectedPropertyId: string | null
  onSelectProperty: (id: string) => void
  activeTarget?: Target
  tempQueryResults: TempQueryResult['results'] | null
  arrivalRangeMinutes: number
  showArrivalRange: boolean
}

const MARKER_COLORS: Record<string, string> = {
  pending: '#e67e22',
  viewed: '#27ae60',
  excluded: '#95a5a6',
  selected: '#3498db',
}

export function AMapView({
  properties,
  selectedPropertyId,
  onSelectProperty,
  activeTarget,
  tempQueryResults,
  arrivalRangeMinutes,
  showArrivalRange,
}: AMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { map, ready, hasKey, satellite, toggleSatellite } = useAMap(containerRef)
  const { refreshProperties } = useAppContext()
  interface RouteSegment {
    type?: string
    instruction?: string
    time?: number
    transit?: Record<string, unknown>
  }
  const [routeInfo, setRouteInfo] = useState<{
    minutes: number
    transfers: number
    walkingDistance: number
    segments: RouteSegment[]
  } | null>(null)

  const handleLocate = useCallback(() => {
    if (!map || !window.AMap) return
    const geolocation = new window.AMap.Geolocation({
      enableHighAccuracy: false,
      timeout: 8000,
      noIpLocation: false,
    })
    geolocation.getCurrentPosition((status: string, result: Record<string, unknown>) => {
      if (status === 'complete') {
        const pos = result.position as { lng: number; lat: number }
        map.setZoomAndCenter(15, [pos.lng, pos.lat])
      } else {
        console.error('[AMap] locate failed:', status, result)
      }
    })
  }, [map])

  const handleRefresh = useCallback(() => {
    refreshProperties()
  }, [refreshProperties])

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen()
    }
  }, [])
  const markersRef = useRef<Map<string, unknown>>(new Map())
  const targetMarkerRef = useRef<unknown>(null)
  const infoWindowRef = useRef<unknown>(null)
  const circleRef = useRef<unknown>(null)
  const transferRef = useRef<unknown>(null)

  // Clear transfer route from map
  const clearRoute = useCallback(() => {
    if (transferRef.current) {
      (transferRef.current as { clear: () => void }).clear()
      transferRef.current = null
    }
    setRouteInfo(null)
  }, [])

  // Extract city from address
  function getCity(address: string): string {
    const match = address.match(/^(.+?[市州])/)
    return match ? match[1] : '深圳市'
  }

  // Use AMap.Transfer plugin to show route
  useEffect(() => {
    if (!map || !window.AMap || !selectedPropertyId || !activeTarget) {
      if (transferRef.current) {
        (transferRef.current as { clear: () => void }).clear()
        transferRef.current = null
      }
      setRouteInfo(null)
      return
    }

    const city = getCity(activeTarget.address)

    // Clear previous route
    if (transferRef.current) {
      (transferRef.current as { clear: () => void }).clear()
      transferRef.current = null
    }

    const transfer = new window.AMap.Transfer({
      map,
      city,
      policy: 0, // LEAST_TIME
      nightflag: 0,
      hideMarkers: false,
    })

    transferRef.current = transfer

    const property = properties.find(p => p.id === selectedPropertyId)
    if (!property) return
    const origin = new window.AMap.LngLat(property.lng, property.lat)
    const destination = new window.AMap.LngLat(activeTarget.lng, activeTarget.lat)

    transfer.search(origin, destination, (status: string, result: Record<string, unknown>) => {
      if (status === 'complete' && result.plans) {
        const plans = result.plans as Array<Record<string, unknown>>
        console.log('[Transfer] plans:', plans.length, plans)

        // Show the first plan summary
        const plan = plans[0]
        if (plan) {
          // Extract segment details if available
          const segments = plan.segments as Array<Record<string, unknown>> | undefined
          const segInfo = segments?.map(s => ({
            type: s.type as string | undefined,
            instruction: s.instruction as string | undefined,
            time: s.time as number | undefined,
            transit: s.transit as Record<string, unknown> | undefined,
          }))
          console.log('[Transfer] segments:', segInfo)

          setRouteInfo({
            minutes: Math.ceil((plan.time as number) / 60),
            transfers: (plan.transit_num as number) ?? 0,
            walkingDistance: (plan.walking_distance as number) ?? 0,
            segments: segInfo ?? [],
          })
          map.setFitView()
        }
      } else {
        console.error('[Transfer] failed:', status, result)
      }
    })

    return () => {
      if (transferRef.current) {
        (transferRef.current as { clear: () => void }).clear()
        transferRef.current = null
      }
    }
  }, [map, selectedPropertyId, activeTarget?.id])

  // Create/update property markers
  useEffect(() => {
    if (!map || !window.AMap) return

    const existingIds = new Set(markersRef.current.keys())
    const currentIds = new Set(properties.map(p => p.id))

    // Remove stale markers
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        const marker = markersRef.current.get(id)
        if (marker) {
          (marker as { setMap: (m: null) => void }).setMap(null)
          markersRef.current.delete(id)
        }
      }
    }

    // Add/update markers
    properties.forEach((property, index) => {
      const isSelected = property.id === selectedPropertyId
      const color = isSelected ? MARKER_COLORS.selected : (STATUS_COLORS[property.status] ?? MARKER_COLORS.pending)
      const commute = getCommuteMinutes(property, activeTarget?.id ?? '', tempQueryResults)

      let marker = markersRef.current.get(property.id) as {
        setMap: (m: AMap.Map) => void
        setPosition: (p: [number, number]) => void
        on: (e: string, h: () => void) => void
      } | undefined

      const labelHtml = `
        <div class="map-marker-label" style="position:relative">
          <div class="marker-bubble" style="
            background:#fff;border-radius:8px;padding:4px 8px;
            box-shadow:0 2px 8px rgba(0,0,0,.15);white-space:nowrap;
            font-size:12px;border:2px solid ${color};cursor:pointer;
            display:flex;flex-direction:column;align-items:center;gap:1px;
          ">
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="
                display:inline-flex;align-items:center;justify-content:center;
                width:20px;height:20px;border-radius:50%;background:${color};
                color:#fff;font-size:11px;font-weight:600;
              ">${index + 1}</span>
              <span style="font-weight:600;color:#333;">${property.name}</span>
            </div>
            ${commute != null ? `<div style="color:${color};font-weight:600;font-size:11px;">${commute} 分钟</div>` : ''}
          </div>
        </div>
      `

      if (!marker) {
        marker = new window.AMap.Marker({
          position: [property.lng, property.lat],
          content: labelHtml,
          offset: new window.AMap.Pixel(-60, -40),
          anchor: 'center',
        })

        marker.on('click', () => {
          onSelectProperty(property.id)
          showInfoWindow(property, index)
        })

        ;(marker as { setMap: (m: AMap.Map) => void }).setMap(map)
        markersRef.current.set(property.id, marker)
      } else {
        marker.setPosition([property.lng, property.lat])
        ;(marker as unknown as { setContent: (c: string) => void }).setContent?.(labelHtml)
      }
    })
  }, [map, properties, selectedPropertyId, activeTarget, tempQueryResults, onSelectProperty])

  // Target marker
  useEffect(() => {
    if (!map || !window.AMap || !activeTarget) {
      if (targetMarkerRef.current && map) {
        (targetMarkerRef.current as { setMap: (m: null) => void }).setMap(null)
        targetMarkerRef.current = null
      }
      return
    }

    const labelHtml = `
      <div class="map-target-label" style="
        background:#1a365d;color:#fff;border-radius:8px;padding:4px 10px;
        font-size:12px;font-weight:600;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,.2);display:flex;align-items:center;gap:4px;
      ">
        <span>🏢</span>
        <span>${activeTarget.name}（${activeTarget.address}）</span>
      </div>
    `

    if (!targetMarkerRef.current) {
      targetMarkerRef.current = new window.AMap.Marker({
        position: [activeTarget.lng, activeTarget.lat],
        content: labelHtml,
        offset: new window.AMap.Pixel(-80, -20),
        anchor: 'center',
      })
      ;(targetMarkerRef.current as { setMap: (m: AMap.Map) => void }).setMap(map)
    } else {
      ;(targetMarkerRef.current as { setPosition: (p: [number, number]) => void }).setPosition([activeTarget.lng, activeTarget.lat])
      ;(targetMarkerRef.current as { setContent: (c: string) => void }).setContent(labelHtml)
    }
  }, [map, activeTarget])

  // Arrival range circle
  useEffect(() => {
    if (!map || !window.AMap || !activeTarget) {
      if (circleRef.current && map) {
        map.remove([circleRef.current])
        circleRef.current = null
      }
      return
    }

    if (circleRef.current) {
      map.remove([circleRef.current])
      circleRef.current = null
    }

    if (showArrivalRange) {
      circleRef.current = new window.AMap.Circle({
        center: [activeTarget.lng, activeTarget.lat],
        radius: arrivalRangeMinutes * 800,
        strokeColor: '#e67e22',
        strokeWeight: 2,
        strokeOpacity: 0.6,
        fillColor: '#e67e22',
        fillOpacity: 0.08,
        strokeStyle: 'dashed',
      })
      ;(circleRef.current as { setMap: (m: AMap.Map) => void }).setMap(map)
    }
  }, [map, activeTarget, showArrivalRange, arrivalRangeMinutes])

  // Info window
  function showInfoWindow(property: Property, index: number) {
    if (!map || !window.AMap) return

    if (!infoWindowRef.current) {
      infoWindowRef.current = new window.AMap.InfoWindow({ offset: new window.AMap.Pixel(0, -30) })
    }

    const commute = getCommuteMinutes(property, activeTarget?.id ?? '', tempQueryResults)
    const content = `
      <div style="padding:8px 12px;min-width:160px;">
        <div style="font-weight:600;font-size:14px;margin-bottom:4px;">
          <span style="
            display:inline-flex;align-items:center;justify-content:center;
            width:18px;height:18px;border-radius:50%;background:${STATUS_COLORS[property.status]};
            color:#fff;font-size:10px;margin-right:4px;
          ">${index + 1}</span>
          ${property.name}
        </div>
        <div style="color:#666;font-size:12px;margin-bottom:4px;">${property.address}</div>
        ${property.price ? `<div style="color:#e67e22;font-weight:600;">¥${property.price}/月</div>` : ''}
        ${commute != null ? `<div style="color:#e67e22;font-weight:600;">${commute} 分钟</div>` : ''}
      </div>
    `
    ;(infoWindowRef.current as { setContent: (c: string) => void }).setContent(content)
    ;(infoWindowRef.current as { open: (m: AMap.Map, p: [number, number]) => void }).open(map, [property.lng, property.lat])
  }

  // Fly to selected property
  useEffect(() => {
    if (!map || !selectedPropertyId) return
    const property = properties.find(p => p.id === selectedPropertyId)
    if (property) {
      map.panTo([property.lng, property.lat])
    }
  }, [map, selectedPropertyId, properties])

  return (
    <>
      <div className="amap-container">
        <div className="amap-toolbar">
          <button
            className={`amap-tool-btn${!satellite ? ' active' : ''}`}
            onClick={() => toggleSatellite(false)}
          >地图</button>
          <button
            className={`amap-tool-btn${satellite ? ' active' : ''}`}
            onClick={() => toggleSatellite(true)}
          >卫星</button>
        </div>
        <div className="amap-left-tools">
          <button className="amap-left-btn" title="定位" onClick={handleLocate}>⊕</button>
          <button className="amap-left-btn" title="刷新" onClick={handleRefresh}>↻</button>
          <button className="amap-left-btn" title="全屏" onClick={handleFullscreen}>⛶</button>
        </div>
        <div className="amap-status-legend">
          <div className="legend-title">状态图例</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#e67e22' }} /> 待看</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#27ae60' }} /> 已看</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#95a5a6' }} /> 排除</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#3498db' }} /> 已选中</div>
        </div>
        {hasKey ? (
          <div ref={containerRef} className="amap-canvas" />
        ) : (
          <div className="amap-placeholder">
            <div className="amap-placeholder-icon">🗺️</div>
            <div className="amap-placeholder-text">请配置 <code>VITE_AMAP_KEY</code> 环境变量以加载高德地图</div>
            <div className="amap-placeholder-hint">在 packages/frontend/.env.local 中设置</div>
          </div>
        )}
      </div>

      {/* Route info panel — outside map container to avoid z-index issues */}
      {routeInfo && (
        <div className="route-info-panel">
          <div className="route-info-header">
            <span className="route-info-icon">🚇</span>
            <span className="route-info-title">公共交通路线</span>
            <button className="route-info-close" onClick={clearRoute}>✕</button>
          </div>
          <div className="route-info-stats">
            <div className="route-stat">
              <span className="route-stat-value">{routeInfo.minutes}</span>
              <span className="route-stat-label">分钟</span>
            </div>
            <div className="route-stat">
              <span className="route-stat-value">{routeInfo.transfers}</span>
              <span className="route-stat-label">换乘</span>
            </div>
            <div className="route-stat">
              <span className="route-stat-value">{routeInfo.walkingDistance > 1000 ? `${(routeInfo.walkingDistance / 1000).toFixed(1)}km` : `${routeInfo.walkingDistance}m`}</span>
              <span className="route-stat-label">步行</span>
            </div>
          </div>
          {routeInfo.segments.length > 0 && (
            <div className="route-info-segments">
              {routeInfo.segments.map((seg, i) => {
                const instr = seg.instruction ?? ''
                const isWalk = instr.includes('步行')
                const isSubway = instr.includes('地铁')
                const icon = isWalk ? '🚶' : isSubway ? '🚇' : '🚌'
                // Simplify: "乘坐地铁14号线(张郭庄--善各庄)途径7站到达阜通" → "地铁14号线 · 7站"
                let label = instr
                const lineMatch = instr.match(/乘坐(.+?)(?:\(|途径|$)/)
                const stationMatch = instr.match(/途径(\d+)站/)
                if (lineMatch) {
                  label = lineMatch[1].trim()
                  if (stationMatch) label += ` · ${stationMatch[1]}站`
                } else if (isWalk) {
                  const distMatch = instr.match(/步行(\d+米)/)
                  label = distMatch ? `步行 ${distMatch[1]}` : '步行'
                }
                const duration = seg.time != null ? `${Math.ceil(seg.time / 60)}分` : ''
                return (
                  <div key={i} className="route-segment">
                    <span className="route-seg-icon">{icon}</span>
                    <span className="route-seg-label">{label}</span>
                    <span className="route-seg-duration">{duration}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}

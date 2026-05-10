import { useEffect, useRef, useState, useCallback } from 'react'

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY as string | undefined
const AMAP_JSCODE = import.meta.env.VITE_AMAP_JSCODE as string | undefined
const HAS_KEY = !!AMAP_KEY
const AMAP_URL = HAS_KEY
  ? `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.Scale,AMap.ToolBar,AMap.Geolocation,AMap.Transfer,AMap.Walking,AMap.TileLayer.Satellite,AMap.TileLayer.RoadNet`
  : ''

// Security config must be set BEFORE the AMap script loads
if (HAS_KEY && AMAP_JSCODE) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)._AMapSecurityConfig = { securityJsCode: AMAP_JSCODE }
}

let scriptLoaded = false
let scriptLoading = false

export function useAMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<unknown>(null)
  const satelliteRef = useRef<unknown>(null)
  const roadNetRef = useRef<unknown>(null)
  const [ready, setReady] = useState(false)
  const [satellite, setSatellite] = useState(false)

  // Step 1: Load AMap script
  useEffect(() => {
    if (!containerRef.current || !HAS_KEY) return
    if (scriptLoaded) { setReady(true); return }

    const existing = document.querySelector(`script[src="${AMAP_URL}"]`)
    if (existing) {
      if (window.AMap) { scriptLoaded = true; setReady(true) }
      return
    }

    if (scriptLoading) return
    scriptLoading = true

    const script = document.createElement('script')
    script.src = AMAP_URL
    script.onload = () => { scriptLoaded = true; scriptLoading = false; setReady(true) }
    script.onerror = () => { scriptLoading = false; console.error('[AMap] script load failed') }
    document.head.appendChild(script)
  }, [containerRef])

  // Step 2: Create map & geolocate via AMap.Geolocation
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return

    const map = new window.AMap.Map(containerRef.current, {
      zoom: 12,
      center: [116.48, 39.99],
      logoPosition: { bottom: '100px', right: '-200px' },
      resizeEnable: true,
      mapStyle: 'amap://styles/whitesmoke',
    })
    mapRef.current = map

    // AMap.Geolocation: tries browser GPS first, falls back to IP
    const geolocation = new window.AMap.Geolocation({
      enableHighAccuracy: false,
      timeout: 8000,
      noIpLocation: false,
    })

    geolocation.getCurrentPosition((status: string, result: Record<string, unknown>) => {
      if (status === 'complete') {
        const pos = result.position as { lng: number; lat: number }
        map.setZoomAndCenter(14, [pos.lng, pos.lat])
      } else {
        console.error('[AMap] geolocation failed:', status, result)
      }
    })

    return () => {
      if (mapRef.current) {
        (mapRef.current as { destroy: () => void }).destroy()
        mapRef.current = null
      }
    }
  }, [ready, containerRef])

  // Toggle satellite layer
  const toggleSatellite = useCallback((on: boolean) => {
    const map = mapRef.current as AMap.Map | null
    if (!map || !window.AMap) return

    if (on) {
      if (!satelliteRef.current) satelliteRef.current = new window.AMap.TileLayer.Satellite()
      if (!roadNetRef.current) roadNetRef.current = new window.AMap.TileLayer.RoadNet()
      ;(satelliteRef.current as { setMap: (m: AMap.Map) => void }).setMap(map)
      ;(roadNetRef.current as { setMap: (m: AMap.Map) => void }).setMap(map)
    } else {
      if (satelliteRef.current) (satelliteRef.current as { setMap: (m: null) => void }).setMap(null)
      if (roadNetRef.current) (roadNetRef.current as { setMap: (m: null) => void }).setMap(null)
    }
    setSatellite(on)
  }, [])

  return {
    map: mapRef.current as unknown as AMap.Map | null,
    ready,
    hasKey: HAS_KEY,
    satellite,
    toggleSatellite,
  }
}

declare namespace AMap {
  class Map {
    constructor(container: HTMLElement, opts?: Record<string, unknown>)
    destroy(): void
    setCenter(center: [number, number]): void
    setZoom(zoom: number): void
    setZoomAndCenter(zoom: number, center: [number, number]): void
    clearMap(): void
    add(overlays: unknown[]): void
    remove(overlays: unknown[]): void
    panTo(center: [number, number]): void
    getZoom(): number
    setFitView(overlays?: unknown[], immediately?: boolean, margins?: number[]): void
  }

  class Marker {
    constructor(opts?: Record<string, unknown>)
    setPosition(pos: [number, number]): void
    setMap(map: Map | null): void
    on(event: string, handler: () => void): void
    off(event: string, handler: () => void): void
  }

  class InfoWindow {
    constructor(opts?: Record<string, unknown>)
    open(map: Map, pos: [number, number]): void
    close(): void
    setContent(content: string): void
  }

  class Circle {
    constructor(opts?: Record<string, unknown>)
    setMap(map: Map | null): void
    setOptions(opts: Record<string, unknown>): void
  }

  class Polyline {
    constructor(opts?: Record<string, unknown>)
    setMap(map: Map | null): void
    setPath(path: [number, number][]): void
  }

  class LngLat {
    constructor(lng: number, lat: number)
  }

  class Pixel {
    constructor(x: number, y: number)
  }

  class Transfer {
    constructor(opts?: Record<string, unknown>)
    search(origin: LngLat, destination: LngLat, callback: (status: string, result: Record<string, unknown>) => void): void
    clear(): void
  }

  namespace Icon {
    class Default {
      constructor()
    }
  }

  namespace Size {
    class Default {
      constructor(width: number, height: number)
    }
  }

  class Geolocation {
    constructor(opts?: Record<string, unknown>)
    getCurrentPosition(callback: (status: string, result: Record<string, unknown>) => void): void
  }

  class CitySearch {
    constructor()
    getLocalCity(callback: (status: string, result: { city?: string; bounds?: Bounds }) => void): void
  }

  type Bounds = unknown

  namespace TileLayer {
    class Satellite {
      constructor(opts?: Record<string, unknown>)
      setMap(map: Map | null): void
    }
    class RoadNet {
      constructor(opts?: Record<string, unknown>)
      setMap(map: Map | null): void
    }
  }

  function load(cb: () => void): void
}

interface Window {
  AMap: typeof AMap
}

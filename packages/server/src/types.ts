export interface Property {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  pricePerSqm?: number
  mediaUrls: string[]
}

export interface Target {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

export interface Settings {
  activeTargetId: string | null
}

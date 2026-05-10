export type PropertyStatus = 'pending' | 'viewed' | 'excluded'
export type PropertyType = 'residential' | 'urban-village' | 'standalone-urban' | 'standalone'
export type RoomType = 'studio' | 'large-studio' | '1b1l' | '2b1l' | 'loft'
export type Decoration = 'luxury' | 'simple'
export type NetworkType = 'included' | 'self' | 'unavailable'
export type ParkingType = 'available' | 'unavailable'

export interface CommuteCacheItem {
  targetId: string
  minutes: number
  mode: 'transit'
  updatedAt: string
}

export interface Property {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  status: PropertyStatus
  price?: number
  propertyType?: PropertyType
  roomType?: RoomType
  area?: number
  floor?: string
  orientation?: string
  decoration?: Decoration
  hasGas?: boolean
  gasFee?: number
  electricityFee?: number
  waterFee?: number
  managementFee?: number
  network?: NetworkType
  networkNote?: string
  fridge?: string
  hasBalcony?: boolean
  parking?: ParkingType
  parkingNote?: string
  note?: string
  pricePerSqm?: number
  mediaUrls: string[]
  commuteCache?: CommuteCacheItem[]
  createdAt: string
  updatedAt: string
}

export interface Target {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  createdAt: string
  updatedAt: string
}

export interface Settings {
  activeTargetId: string | null
}

export interface TempQueryResult {
  targetId: string
  name: string
  address: string
  results: { propertyId: string; minutes: number }[]
}

export type ViewMode = 'list' | 'detail' | 'form'

export interface AppState {
  properties: Property[]
  targets: Target[]
  settings: Settings
  selectedPropertyId: string | null
  viewMode: ViewMode
  editingProperty: Property | null
  tempQuery: TempQueryResult | null
  arrivalRangeMinutes: number
  showArrivalRange: boolean
}

export type PropertyStatus = 'pending' | 'viewed' | 'excluded'
export type PropertyType = 'residential' | 'urban-village' | 'standalone-urban' | 'standalone'
export type RoomType = 'studio' | 'large-studio' | '1b1l' | '2b1l' | 'loft'
export type Decoration = 'luxury' | 'simple'
export type ParkingType = 'available' | 'unavailable'
export type NetworkBillingType = 'included' | 'extra' | 'unknown'
export type CarrierCoverageType = 'covered' | 'not_covered' | 'unknown'

export interface CommuteCacheItem {
  targetId: string
  minutes: number
  mode: 'transit'
  updatedAt: string
}

export interface InternetInfo {
  provided: {
    available: boolean
    billing?: NetworkBillingType
    monthlyFee?: number
    bandwidthDownMbps?: number
  }
  selfInstall: {
    allowed: boolean
    carrierCoverage?: CarrierCoverageType
  }
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
  internet?: InternetInfo
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

export type IntakeStage = 'stage1' | 'stage2'

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

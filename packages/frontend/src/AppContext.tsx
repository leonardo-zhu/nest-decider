import { createContext, useContext } from 'react'
import type { AppState, Property, Target, Settings, TempQueryResult } from './types'

export interface AppContextValue {
  state: AppState
  // Properties
  properties: Property[]
  propertiesLoading: boolean
  refreshProperties: () => Promise<void>
  createProperty: (payload: Partial<Property>) => Promise<Property>
  updateProperty: (id: string, payload: Partial<Property>) => Promise<Property>
  removeProperty: (id: string) => Promise<void>
  // Targets
  targets: Target[]
  settings: Settings
  targetsLoading: boolean
  refreshTargets: () => Promise<void>
  createTarget: (payload: Partial<Target>) => Promise<Target>
  updateTarget: (id: string, payload: Partial<Target>) => Promise<Target>
  removeTarget: (id: string) => Promise<void>
  setActiveTarget: (id: string | null) => Promise<void>
  // UI
  selectedPropertyId: string | null
  setSelectedPropertyId: (id: string | null) => void
  viewMode: AppState['viewMode']
  setViewMode: (mode: AppState['viewMode']) => void
  editingProperty: Property | null
  setEditingProperty: (p: Property | null) => void
  tempQuery: TempQueryResult | null
  setTempQuery: (q: TempQueryResult | null) => void
  arrivalRangeMinutes: number
  setArrivalRangeMinutes: (n: number) => void
  showArrivalRange: boolean
  setShowArrivalRange: (v: boolean) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

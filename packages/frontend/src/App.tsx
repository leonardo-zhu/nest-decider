import { useState, useCallback } from 'react'
import { AppContext, type AppContextValue } from './AppContext'
import { useProperties, useTargets } from './hooks'
import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { AMapView } from './components/AMapView'
import { PropertyList } from './components/PropertyList'
import { PropertyDetail } from './components/PropertyDetail'
import { PropertyForm } from './components/PropertyForm'
import type { Property, TempQueryResult, ViewMode } from './types'

export function App() {
  const properties = useProperties()
  const targets = useTargets()

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [tempQuery, setTempQuery] = useState<TempQueryResult | null>(null)
  const [arrivalRangeMinutes, setArrivalRangeMinutes] = useState(45)
  const [showArrivalRange, setShowArrivalRange] = useState(false)

  const handleSelectProperty = useCallback((id: string | null) => {
    setSelectedPropertyId(id)
    if (id) setViewMode('detail')
  }, [])

  const handleEditProperty = useCallback((p: Property | null) => {
    setEditingProperty(p)
    setViewMode('form')
  }, [])

  const handleNewProperty = useCallback(() => {
    setEditingProperty(null)
    setViewMode('form')
  }, [])

  const handleFormClose = useCallback(() => {
    setEditingProperty(null)
    setViewMode('list')
  }, [])

  const handleFormSave = useCallback(async (data: Partial<Property>) => {
    if (editingProperty) {
      await properties.update(editingProperty.id, data)
    } else {
      await properties.create({
        ...data,
        id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      })
    }
    setEditingProperty(null)
    setViewMode('list')
  }, [editingProperty, properties])

  const handleBackToList = useCallback(() => {
    setSelectedPropertyId(null)
    setViewMode('list')
  }, [])

  const ctx: AppContextValue = {
    state: {
      properties: properties.data,
      targets: targets.targets,
      settings: targets.settings,
      selectedPropertyId,
      viewMode,
      editingProperty,
      tempQuery,
      arrivalRangeMinutes,
      showArrivalRange,
    },
    properties: properties.data,
    propertiesLoading: properties.loading,
    refreshProperties: properties.refresh,
    createProperty: properties.create,
    updateProperty: properties.update,
    removeProperty: properties.remove,
    targets: targets.targets,
    settings: targets.settings,
    targetsLoading: targets.loading,
    refreshTargets: targets.refresh,
    createTarget: targets.create,
    updateTarget: targets.update,
    removeTarget: targets.remove,
    setActiveTarget: targets.setActive,
    selectedPropertyId,
    setSelectedPropertyId: handleSelectProperty,
    viewMode,
    setViewMode,
    editingProperty,
    setEditingProperty: handleEditProperty,
    tempQuery,
    setTempQuery,
    arrivalRangeMinutes,
    setArrivalRangeMinutes,
    showArrivalRange,
    setShowArrivalRange,
  }

  const activeTarget = targets.targets.find(t => t.id === targets.settings.activeTargetId)
  const selectedProperty = properties.data.find(p => p.id === selectedPropertyId)

  return (
    <AppContext.Provider value={ctx}>
      <div className="app">
        <Header onAddProperty={handleNewProperty} />

        <StatusBar
          activeTarget={activeTarget}
          tempQuery={tempQuery}
          onClearTempQuery={() => setTempQuery(null)}
        />

        <div className="main-content">
          <div className="map-panel">
            <AMapView
              properties={properties.data}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={handleSelectProperty}
              activeTarget={activeTarget}
              tempQueryResults={tempQuery?.results ?? null}
              arrivalRangeMinutes={arrivalRangeMinutes}
              showArrivalRange={showArrivalRange}
            />
          </div>
          <div className="list-panel">
            {viewMode === 'form' ? (
              <PropertyForm
                property={editingProperty}
                properties={properties.data}
                onSave={handleFormSave}
                onClose={handleFormClose}
              />
            ) : viewMode === 'detail' && selectedProperty ? (
              <PropertyDetail
                property={selectedProperty}
                onBack={handleBackToList}
                onEdit={() => handleEditProperty(selectedProperty)}
              />
            ) : (
              <PropertyList
                properties={properties.data}
                selectedPropertyId={selectedPropertyId}
                onSelectProperty={handleSelectProperty}
                tempQueryResults={tempQuery?.results ?? null}
              />
            )}
          </div>
        </div>

        <footer className="app-footer">
          <div className="footer-item">
            <span className="footer-icon">💡</span>
            <span>提示：点击地图标记或列表行可查看详情，双向联动</span>
          </div>
          {activeTarget && (
            <div className="footer-item">
              <span className="footer-icon">🏢</span>
              <span>目标：{activeTarget.name}（{activeTarget.address}）</span>
            </div>
          )}
          {showArrivalRange && (
            <div className="footer-item">
              <span className="footer-icon">⏱</span>
              <span>到达圈：{arrivalRangeMinutes} 分钟（公交）</span>
            </div>
          )}
          <div className="footer-item footer-right">
            <span>数据由高德地图提供</span>
          </div>
        </footer>
      </div>
    </AppContext.Provider>
  )
}

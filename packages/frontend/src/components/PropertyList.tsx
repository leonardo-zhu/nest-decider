import { useState, useMemo } from 'react'
import type { Property, TempQueryResult } from '../types'
import { PropertyCard } from './PropertyCard'
import { getCommuteMinutes, STATUS_LABELS, STATUS_COLORS, ROOM_TYPE_LABELS, formatPrice, formatPricePerSqm } from '../utils'

interface PropertyListProps {
  properties: Property[]
  selectedPropertyId: string | null
  onSelectProperty: (id: string) => void
  tempQueryResults: TempQueryResult['results'] | null
}

type DisplayMode = 'card' | 'list'

export function PropertyList({ properties, selectedPropertyId, onSelectProperty, tempQueryResults }: PropertyListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card')

  const totalPages = Math.ceil(properties.length / pageSize)
  const paged = useMemo(() => properties.slice((page - 1) * pageSize, page * pageSize), [properties, page, pageSize])

  return (
    <div className="property-list">
      <div className="list-header">
        <div className="list-title">
          <span className="list-icon">🌱</span>
          <strong>{properties.length}</strong> 套房源
        </div>
        <div className="list-actions">
          <button
            className={`display-toggle-btn ${displayMode === 'card' ? 'active' : ''}`}
            onClick={() => setDisplayMode('card')}
            title="卡片视图"
          >▦</button>
          <button
            className={`display-toggle-btn ${displayMode === 'list' ? 'active' : ''}`}
            onClick={() => setDisplayMode('list')}
            title="列表视图"
          >☰</button>
        </div>
      </div>

      {displayMode === 'card' ? (
        <div className="card-grid">
          {paged.map((property, i) => (
            <PropertyCard
              key={property.id}
              property={property}
              index={(page - 1) * pageSize + i}
              isSelected={property.id === selectedPropertyId}
              onSelect={onSelectProperty}
              commuteMinutes={getCommuteMinutes(property, '', tempQueryResults)}
            />
          ))}
        </div>
      ) : (
        <div className="list-view">
          <div className="list-view-header">
            <span className="lv-col lv-index">#</span>
            <span className="lv-col lv-name">名称</span>
            <span className="lv-col lv-type">房型</span>
            <span className="lv-col lv-price">租金</span>
            <span className="lv-col lv-area">面积</span>
            <span className="lv-col lv-unit">单价</span>
            <span className="lv-col lv-status">状态</span>
            <span className="lv-col lv-commute">通勤</span>
          </div>
          {paged.map((property, i) => {
            const idx = (page - 1) * pageSize + i
            const commute = getCommuteMinutes(property, '', tempQueryResults)
            const statusColor = STATUS_COLORS[property.status] ?? '#e67e22'
            return (
              <div
                key={property.id}
                className={`list-view-row ${property.id === selectedPropertyId ? 'selected' : ''}`}
                onClick={() => onSelectProperty(property.id)}
              >
                <span className="lv-col lv-index">
                  <span className="lv-index-dot" style={{ background: statusColor }}>{idx + 1}</span>
                </span>
                <span className="lv-col lv-name" title={property.address}>{property.name}</span>
                <span className="lv-col lv-type">{property.roomType ? ROOM_TYPE_LABELS[property.roomType] : '-'}</span>
                <span className="lv-col lv-price">{formatPrice(property.price)}</span>
                <span className="lv-col lv-area">{property.area != null ? `${property.area}m²` : '-'}</span>
                <span className="lv-col lv-unit">{formatPricePerSqm(property)}</span>
                <span className="lv-col lv-status">
                  <span className="lv-status-tag" style={{ color: statusColor, borderColor: statusColor }}>
                    {STATUS_LABELS[property.status]}
                  </span>
                </span>
                <span className="lv-col lv-commute">{commute != null ? `${commute}分` : '-'}</span>
              </div>
            )
          })}
        </div>
      )}

      {properties.length === 0 && (
        <div className="list-empty">暂无房源数据</div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            &lt;
          </button>
          <span className="page-current">{page}</span>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            &gt;
          </button>
          <select
            className="page-size-select"
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
          >
            {[8, 20, 50].map(s => (
              <option key={s} value={s}>{s} 条/页</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

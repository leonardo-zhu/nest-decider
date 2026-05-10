import type { Property, TempQueryResult } from '../types'
import { getCommuteMinutes, STATUS_COLORS, ROOM_TYPE_LABELS, DEORATION_LABELS, formatPrice } from '../utils'

interface PropertyCardProps {
  property: Property
  index: number
  isSelected: boolean
  onSelect: (id: string) => void
  commuteMinutes: number | null
}

const FEATURES = [
  { key: 'hasGas', icon: '🔥', label: '燃气' },
  { key: 'hasBalcony', icon: '☀️', label: '阳台' },
  { key: 'decoration', icon: '💡', label: '装修' },
  { key: 'parking', icon: '🅿️', label: '车位' },
]

export function PropertyCard({ property, index, isSelected, onSelect, commuteMinutes }: PropertyCardProps) {
  const statusColor = STATUS_COLORS[property.status] ?? '#e67e22'

  return (
    <div
      className={`property-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(property.id)}
    >
      <div className="card-header">
        <span className="card-index" style={{ background: statusColor }}>{index + 1}</span>
        <span className="card-name">{property.name}</span>
      </div>
      <div className="card-room-type">{property.roomType ? ROOM_TYPE_LABELS[property.roomType] : '-'}</div>
      <div className="card-price">{formatPrice(property.price)}</div>
      <div className="card-meta">
        {property.area != null && <span>{property.area}m²</span>}
        {property.decoration && <span>· {DEORATION_LABELS[property.decoration]}</span>}
        {property.orientation && <span>· {property.orientation}</span>}
      </div>
      <div className="card-features">
        {property.hasGas && <span className="feature-icon" title="有燃气">🔥</span>}
        {property.hasBalcony && <span className="feature-icon" title="含阳台">☀️</span>}
        {property.decoration === 'luxury' && <span className="feature-icon" title="精装">💡</span>}
        {property.parking === 'available' && <span className="feature-icon" title="有车位">🅿️</span>}
      </div>
      {commuteMinutes != null && (
        <div className="card-commute" style={{ color: statusColor }}>
          {commuteMinutes} 分钟
        </div>
      )}
    </div>
  )
}

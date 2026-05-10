import { useState } from 'react'
import type { Property } from '../types'
import { useAppContext } from '../AppContext'
import { STATUS_LABELS, STATUS_COLORS, ROOM_TYPE_LABELS, DEORATION_LABELS, formatPrice, formatPricePerSqm } from '../utils'

interface PropertyDetailProps {
  property: Property
  onBack: () => void
  onEdit: () => void
}

export function PropertyDetail({ property, onBack, onEdit }: PropertyDetailProps) {
  const { removeProperty } = useAppContext()
  const [poiCategory, setPoiCategory] = useState<'subway' | 'market' | 'hospital'>('subway')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await removeProperty(property.id)
    onBack()
  }

  const statusColor = STATUS_COLORS[property.status]

  return (
    <div className="property-detail">
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>← 返回列表</button>
        <div className="detail-actions">
          <button className="btn-edit" onClick={onEdit}>编辑</button>
          <button className="btn-delete" onClick={handleDelete}>
            {confirmDelete ? '确认删除？' : '删除'}
          </button>
        </div>
      </div>

      <div className="detail-title">
        <span className="detail-index" style={{ background: statusColor }}>
          {property.name.charAt(0)}
        </span>
        <div>
          <h2>{property.name}</h2>
          <span className="detail-status" style={{ color: statusColor }}>
            {STATUS_LABELS[property.status]}
          </span>
        </div>
      </div>

      {property.mediaUrls.length > 0 && (
        <div className="detail-media">
          {property.mediaUrls.map((url, i) => (
            <div key={i} className="media-item">
              {url.match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={url} controls className="media-video" />
              ) : (
                <img src={url} alt="" className="media-image" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="detail-section">
        <h3>基本信息</h3>
        <div className="detail-grid">
          <div className="detail-field">
            <span className="field-label">地址</span>
            <span className="field-value">{property.address}</span>
          </div>
          {property.price != null && (
            <div className="detail-field">
              <span className="field-label">租金</span>
              <span className="field-value price">{formatPrice(property.price)}</span>
            </div>
          )}
          {property.area != null && (
            <div className="detail-field">
              <span className="field-label">面积</span>
              <span className="field-value">{property.area}m²</span>
            </div>
          )}
          <div className="detail-field">
            <span className="field-label">单价</span>
            <span className="field-value">{formatPricePerSqm(property)}</span>
          </div>
          {property.floor && (
            <div className="detail-field">
              <span className="field-label">楼层</span>
              <span className="field-value">{property.floor}</span>
            </div>
          )}
          {property.orientation && (
            <div className="detail-field">
              <span className="field-label">朝向</span>
              <span className="field-value">{property.orientation}</span>
            </div>
          )}
          {property.decoration && (
            <div className="detail-field">
              <span className="field-label">装修</span>
              <span className="field-value">{DEORATION_LABELS[property.decoration]}</span>
            </div>
          )}
          {property.roomType && (
            <div className="detail-field">
              <span className="field-label">房型</span>
              <span className="field-value">{ROOM_TYPE_LABELS[property.roomType]}</span>
            </div>
          )}
          {property.hasGas != null && (
            <div className="detail-field">
              <span className="field-label">燃气</span>
              <span className="field-value">{property.hasGas ? '有' : '无'}</span>
            </div>
          )}
          {property.hasBalcony != null && (
            <div className="detail-field">
              <span className="field-label">阳台</span>
              <span className="field-value">{property.hasBalcony ? '有' : '无'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h3>费用</h3>
        <div className="detail-grid">
          {property.gasFee != null && (
            <div className="detail-field">
              <span className="field-label">燃气费</span>
              <span className="field-value">{property.gasFee} 元/方</span>
            </div>
          )}
          {property.electricityFee != null && (
            <div className="detail-field">
              <span className="field-label">电费</span>
              <span className="field-value">{property.electricityFee} 元/度</span>
            </div>
          )}
          {property.waterFee != null && (
            <div className="detail-field">
              <span className="field-label">水费</span>
              <span className="field-value">{property.waterFee} 元/吨</span>
            </div>
          )}
          {property.managementFee != null && (
            <div className="detail-field">
              <span className="field-label">管理费</span>
              <span className="field-value">{property.managementFee} 元/月</span>
            </div>
          )}
          {property.internet && (
            <div className="detail-field">
              <span className="field-label">网络</span>
              <span className="field-value">
                {renderInternetSummary(property)}
              </span>
            </div>
          )}
          {property.fridge && (
            <div className="detail-field">
              <span className="field-label">冰箱</span>
              <span className="field-value">{property.fridge}</span>
            </div>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h3>周边POI</h3>
        <div className="poi-tabs">
          {(['subway', 'market', 'hospital'] as const).map(cat => (
            <button
              key={cat}
              className={`poi-tab ${poiCategory === cat ? 'active' : ''}`}
              onClick={() => setPoiCategory(cat)}
            >
              {cat === 'subway' ? '地铁站' : cat === 'market' ? '超市/便利店' : '医院'}
            </button>
          ))}
        </div>
        <div className="poi-content">
          <span className="poi-placeholder">点击查询按钮获取数据</span>
        </div>
      </div>

      {property.note && (
        <div className="detail-section">
          <h3>备注</h3>
          <div className="detail-note">{property.note}</div>
        </div>
      )}
    </div>
  )
}

function renderInternetSummary(property: Property): string {
  const internet = property.internet
  if (!internet) return '-'

  const provided = internet.provided.available
    ? (
      internet.provided.billing === 'included'
        ? '房东提供（包网）'
        : internet.provided.billing === 'extra'
          ? `房东提供（额外${internet.provided.monthlyFee ?? '-'}元/月）`
          : '房东提供（计费未知）'
    )
    : '房东不提供'
  const bandwidth = internet.provided.available && internet.provided.bandwidthDownMbps != null
    ? `，下行${internet.provided.bandwidthDownMbps}Mbps`
    : ''

  const selfInstall = internet.selfInstall.allowed
    ? (
      internet.selfInstall.carrierCoverage === 'covered'
        ? '，支持自接（运营商覆盖）'
        : internet.selfInstall.carrierCoverage === 'not_covered'
          ? '，支持自接（运营商不覆盖）'
          : '，支持自接（覆盖未知）'
    )
    : '，不支持自接'

  return `${provided}${bandwidth}${selfInstall}`
}

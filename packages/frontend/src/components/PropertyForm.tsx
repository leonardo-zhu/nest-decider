import { useState } from 'react'
import type { Property } from '../types'
import { ROOM_TYPE_LABELS, PROPERTY_TYPE_LABELS, ORIENTATION_OPTIONS, DEORATION_LABELS } from '../utils'

interface PropertyFormProps {
  property: Property | null
  onSave: (data: Partial<Property>) => Promise<void>
  onClose: () => void
}

export function PropertyForm({ property, onSave, onClose }: PropertyFormProps) {
  const isEdit = !!property
  const [stage, setStage] = useState<'stage1' | 'stage2'>(property?.price != null ? 'stage2' : 'stage1')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: property?.name ?? '',
    address: property?.address ?? '',
    lat: property?.lat ?? 0,
    lng: property?.lng ?? 0,
    propertyType: property?.propertyType ?? '' as string,
    roomType: property?.roomType ?? '' as string,
    price: property?.price?.toString() ?? '',
    area: property?.area?.toString() ?? '',
    floor: property?.floor ?? '',
    orientation: property?.orientation ?? '',
    decoration: property?.decoration ?? '' as string,
    hasGas: property?.hasGas ?? false,
    gasFee: property?.gasFee?.toString() ?? '',
    electricityFee: property?.electricityFee?.toString() ?? '',
    waterFee: property?.waterFee?.toString() ?? '',
    managementFee: property?.managementFee?.toString() ?? '',
    network: property?.network ?? '' as string,
    networkNote: property?.networkNote ?? '',
    fridge: property?.fridge ?? '',
    hasBalcony: property?.hasBalcony ?? false,
    parking: property?.parking ?? '' as string,
    parkingNote: property?.parkingNote ?? '',
    note: property?.note ?? '',
    status: property?.status ?? 'pending' as string,
  })

  const set = (key: string, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload: Partial<Property> = {
        name: form.name,
        address: form.address,
        lat: form.lat,
        lng: form.lng,
        status: form.status as Property['status'],
      }
      if (form.propertyType) payload.propertyType = form.propertyType as Property['propertyType']
      if (form.roomType) payload.roomType = form.roomType as Property['roomType']
      if (form.price) payload.price = Number(form.price)
      if (form.area) payload.area = Number(form.area)
      if (form.floor) payload.floor = form.floor
      if (form.orientation) payload.orientation = form.orientation
      if (form.decoration) payload.decoration = form.decoration as Property['decoration']
      payload.hasGas = form.hasGas
      if (form.gasFee) payload.gasFee = Number(form.gasFee)
      if (form.electricityFee) payload.electricityFee = Number(form.electricityFee)
      if (form.waterFee) payload.waterFee = Number(form.waterFee)
      if (form.managementFee) payload.managementFee = Number(form.managementFee)
      if (form.network) payload.network = form.network as Property['network']
      if (form.networkNote) payload.networkNote = form.networkNote
      if (form.fridge) payload.fridge = form.fridge
      payload.hasBalcony = form.hasBalcony
      if (form.parking) payload.parking = form.parking as Property['parking']
      if (form.parkingNote) payload.parkingNote = form.parkingNote
      if (form.note) payload.note = form.note
      if (form.price && form.area) {
        payload.pricePerSqm = Number(form.price) / Number(form.area)
      }
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="property-form">
      <div className="form-header">
        <button className="btn-back" onClick={onClose}>← 取消</button>
        <h2>{isEdit ? '编辑房源' : '添加房源'}</h2>
        <div className="form-stage-tabs">
          <button
            className={`stage-tab ${stage === 'stage1' ? 'active' : ''}`}
            onClick={() => setStage('stage1')}
          >
            阶段一：基本信息
          </button>
          <button
            className={`stage-tab ${stage === 'stage2' ? 'active' : ''}`}
            onClick={() => setStage('stage2')}
          >
            阶段二：详细信息
          </button>
        </div>
      </div>

      <div className="form-body">
        {stage === 'stage1' ? (
          <div className="form-fields">
            <div className="form-field">
              <label>房源类型</label>
              <select value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
                <option value="">请选择</option>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>房型</label>
              <select value={form.roomType} onChange={e => set('roomType', e.target.value)}>
                <option value="">请选择</option>
                {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>名称</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="如 朝阳某小区 2室1厅" />
            </div>
            <div className="form-field">
              <label>地址</label>
              <input type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="输入地址" />
            </div>
            <div className="form-field">
              <label>纬度</label>
              <input type="number" step="any" value={form.lat} onChange={e => set('lat', Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label>经度</label>
              <input type="number" step="any" value={form.lng} onChange={e => set('lng', Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label>状态</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">待看</option>
                <option value="viewed">已看</option>
                <option value="excluded">排除</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="form-fields">
            <div className="form-field">
              <label>租金（元/月）</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="5200" />
            </div>
            <div className="form-field">
              <label>面积（m²）</label>
              <input type="number" value={form.area} onChange={e => set('area', e.target.value)} placeholder="65" />
            </div>
            <div className="form-field">
              <label>楼层</label>
              <input type="text" value={form.floor} onChange={e => set('floor', e.target.value)} placeholder="如 6/18" />
            </div>
            <div className="form-field">
              <label>朝向</label>
              <select value={form.orientation} onChange={e => set('orientation', e.target.value)}>
                <option value="">请选择</option>
                {ORIENTATION_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>装修</label>
              <select value={form.decoration} onChange={e => set('decoration', e.target.value)}>
                <option value="">请选择</option>
                {Object.entries(DEORATION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>有无燃气</label>
              <select value={form.hasGas ? 'yes' : 'no'} onChange={e => set('hasGas', e.target.value === 'yes')}>
                <option value="no">无</option>
                <option value="yes">有</option>
              </select>
            </div>
            {form.hasGas && (
              <div className="form-field">
                <label>燃气费（元/方）</label>
                <input type="number" value={form.gasFee} onChange={e => set('gasFee', e.target.value)} />
              </div>
            )}
            <div className="form-field">
              <label>电费（元/度）</label>
              <input type="number" value={form.electricityFee} onChange={e => set('electricityFee', e.target.value)} />
            </div>
            <div className="form-field">
              <label>水费（元/吨）</label>
              <input type="number" value={form.waterFee} onChange={e => set('waterFee', e.target.value)} />
            </div>
            <div className="form-field">
              <label>管理费（元/月）</label>
              <input type="number" value={form.managementFee} onChange={e => set('managementFee', e.target.value)} />
            </div>
            <div className="form-field">
              <label>网络</label>
              <select value={form.network} onChange={e => set('network', e.target.value)}>
                <option value="">请选择</option>
                <option value="included">包网</option>
                <option value="self">可自接</option>
                <option value="unavailable">不可接</option>
              </select>
            </div>
            {form.network === 'included' && (
              <div className="form-field">
                <label>包网费用说明</label>
                <input type="text" value={form.networkNote} onChange={e => set('networkNote', e.target.value)} />
              </div>
            )}
            <div className="form-field">
              <label>冰箱</label>
              <input type="text" value={form.fridge} onChange={e => set('fridge', e.target.value)} placeholder="如 无 / 双门小冰箱" />
            </div>
            <div className="form-field">
              <label>含阳台</label>
              <select value={form.hasBalcony ? 'yes' : 'no'} onChange={e => set('hasBalcony', e.target.value === 'yes')}>
                <option value="no">无</option>
                <option value="yes">有</option>
              </select>
            </div>
            <div className="form-field">
              <label>车位</label>
              <select value={form.parking} onChange={e => set('parking', e.target.value)}>
                <option value="">请选择</option>
                <option value="available">有</option>
                <option value="unavailable">无</option>
              </select>
            </div>
            <div className="form-field full-width">
              <label>备注</label>
              <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3} />
            </div>
          </div>
        )}
      </div>

      <div className="form-footer">
        <button className="btn-cancel" onClick={onClose}>取消</button>
        <button className="btn-save" onClick={handleSubmit} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}

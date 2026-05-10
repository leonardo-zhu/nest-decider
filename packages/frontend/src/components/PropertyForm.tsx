import { useEffect, useMemo, useState } from 'react'
import type { Property } from '../types'
import { ROOM_TYPE_LABELS, PROPERTY_TYPE_LABELS, ORIENTATION_OPTIONS, DEORATION_LABELS } from '../utils'

interface PropertyFormProps {
  property: Property | null
  properties: Property[]
  onSave: (data: Partial<Property>) => Promise<void>
  onClose: () => void
}

type InternetProvidedBilling = NonNullable<NonNullable<Property['internet']>['provided']['billing']>
type SelfCarrierCoverage = NonNullable<NonNullable<Property['internet']>['selfInstall']['carrierCoverage']>

export function PropertyForm({ property, properties, onSave, onClose }: PropertyFormProps) {
  const isEdit = !!property
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [addressPicked, setAddressPicked] = useState(!!property)
  const [suggestions, setSuggestions] = useState<AMap.AutoCompleteResultItem[]>([])
  const [mediaInput, setMediaInput] = useState('')
  const [isComposingAddress, setIsComposingAddress] = useState(false)
  const [submitError, setSubmitError] = useState('')

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
    internetProvidedAvailable: property?.internet?.provided.available ?? false,
    internetProvidedBilling: property?.internet?.provided.billing ?? 'unknown',
    internetProvidedMonthlyFee: property?.internet?.provided.monthlyFee?.toString() ?? '',
    internetProvidedBandwidthDownMbps: property?.internet?.provided.bandwidthDownMbps?.toString() ?? '',
    internetSelfInstallAllowed: property?.internet?.selfInstall.allowed ?? false,
    internetSelfCarrierCoverage: property?.internet?.selfInstall.carrierCoverage ?? 'unknown',
    fridge: property?.fridge ?? '',
    hasBalcony: property?.hasBalcony ?? false,
    parking: property?.parking ?? '' as string,
    parkingNote: property?.parkingNote ?? '',
    note: property?.note ?? '',
    status: property?.status ?? 'pending' as string,
    mediaUrls: property?.mediaUrls ?? [],
  })

  const set = (key: string, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    const keyword = form.address.trim()
    if (!keyword || !window.AMap || isComposingAddress) {
      setSuggestions([])
      setSearching(false)
      return
    }

    setSearching(true)
    const timer = window.setTimeout(() => {
      window.AMap.plugin('AMap.AutoComplete', () => {
        const autoComplete = new window.AMap.AutoComplete({})
        autoComplete.search(keyword, (status, result) => {
          setSearching(false)
          if (status !== 'complete' || !result?.tips) {
            setSuggestions([])
            return
          }
          const validTips = result.tips.filter(t => !!t.location)
          setSuggestions(validTips)
        })
      })
    }, 600)

    return () => {
      window.clearTimeout(timer)
    }
  }, [form.address, isComposingAddress])

  const addressHint = useMemo(() => {
    if (addressError) return addressError
    if (addressPicked) return '已选择候选地址，可直接保存'
    if (form.address.trim()) return '请从下拉候选中选择，自动填充经纬度'
    return ''
  }, [addressError, addressPicked, form.address])

  const handleAddressInput = (value: string) => {
    set('address', value)
    setAddressPicked(false)
    setAddressError('')
  }

  const handleSelectSuggestion = (item: AMap.AutoCompleteResultItem) => {
    if (!item.location) return
    set('address', item.district ? `${item.district}${item.address ?? ''}${item.name}` : `${item.address ?? ''}${item.name}`)
    set('lng', item.location.lng)
    set('lat', item.location.lat)
    setAddressPicked(true)
    setAddressError('')
    setSuggestions([])
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setSubmitError('请先填写房源名称')
      return
    }
    if (!form.address.trim()) {
      setSubmitError('请先填写地址')
      return
    }
    if (!addressPicked) {
      setAddressError('请先从候选地址中选择一项，再保存房源')
      setSubmitError('')
      return
    }
    if (!Number.isFinite(form.lat) || !Number.isFinite(form.lng)) {
      setSubmitError('地址坐标无效，请重新选择候选地址')
      return
    }
    setSubmitError('')
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
      payload.internet = {
        provided: {
          available: form.internetProvidedAvailable,
              ...(form.internetProvidedAvailable
            ? {
              billing: form.internetProvidedBilling as InternetProvidedBilling,
              ...(form.internetProvidedBilling === 'extra' && form.internetProvidedMonthlyFee
                ? { monthlyFee: Number(form.internetProvidedMonthlyFee) }
                : {}),
              ...(form.internetProvidedBandwidthDownMbps
                ? { bandwidthDownMbps: Number(form.internetProvidedBandwidthDownMbps) }
                : {}),
            }
            : {}),
        },
        selfInstall: {
          allowed: form.internetSelfInstallAllowed,
          ...(form.internetSelfInstallAllowed
            ? { carrierCoverage: form.internetSelfCarrierCoverage as SelfCarrierCoverage }
            : {}),
        },
      }
      if (form.fridge) payload.fridge = form.fridge
      payload.hasBalcony = form.hasBalcony
      if (form.parking) payload.parking = form.parking as Property['parking']
      if (form.parkingNote) payload.parkingNote = form.parkingNote
      if (form.note) payload.note = form.note
      payload.mediaUrls = form.mediaUrls
      if (form.price && form.area) {
        payload.pricePerSqm = Number(form.price) / Number(form.area)
      }
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  const duplicateHint = useMemo(() => {
    const name = form.name.trim().toLowerCase()
    if (!name || !Number.isFinite(form.lat) || !Number.isFinite(form.lng)) return ''
    const candidates = properties.filter(item => item.id !== property?.id)
    const nearBy = candidates.find((item) => {
      const distance = calcDistanceMeters(form.lat, form.lng, item.lat, item.lng)
      const similarName = item.name.trim().toLowerCase().includes(name) || name.includes(item.name.trim().toLowerCase())
      return distance < 80 || (distance < 200 && similarName)
    })
    if (!nearBy) return ''
    return `疑似重复：与「${nearBy.name}」距离较近，保存前请确认不是同一套房`
  }, [form.lat, form.lng, form.name, properties, property?.id])

  const handleAddMediaUrls = () => {
    const urls = mediaInput
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
    if (!urls.length) return
    const deduped = Array.from(new Set([...form.mediaUrls, ...urls]))
    setForm(prev => ({ ...prev, mediaUrls: deduped }))
    setMediaInput('')
  }

  const handleRemoveMediaUrl = (url: string) => {
    setForm(prev => ({ ...prev, mediaUrls: prev.mediaUrls.filter(item => item !== url) }))
  }

  return (
    <div className="property-form">
      <div className="form-header">
        <button className="btn-back" onClick={onClose}>← 取消</button>
        <h2>{isEdit ? '编辑房源' : '添加房源'}</h2>
      </div>

      <div className="form-body">
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
            <input type="text" value={form.name} onChange={e => { set('name', e.target.value); setSubmitError('') }} placeholder="如 朝阳某小区 2室1厅" />
          </div>
          <div className="form-field">
            <label>地址</label>
            <div className="address-autocomplete">
              <input
                type="text"
                value={form.address}
                onChange={e => handleAddressInput(e.target.value)}
                onCompositionStart={() => setIsComposingAddress(true)}
                onCompositionEnd={e => {
                  setIsComposingAddress(false)
                  handleAddressInput(e.currentTarget.value)
                }}
                placeholder="输入地址并从候选中选择"
              />
              {suggestions.length > 0 && !addressPicked && (
                <div className="address-suggestion-list">
                  {suggestions.map((item, i) => (
                    <button
                      key={`${item.name}-${item.location?.lng ?? 'na'}-${item.location?.lat ?? 'na'}-${i}`}
                      type="button"
                      className="address-suggestion-item"
                      onMouseDown={e => {
                        e.preventDefault()
                        handleSelectSuggestion(item)
                      }}
                    >
                      <span>{item.name}</span>
                      <small>{[item.district, item.address].filter(Boolean).join(' ') || '未知地址'}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {searching && <small className="form-hint">正在搜索地址...</small>}
            {addressHint && <small className={`form-hint ${addressError ? 'error' : ''}`}>{addressHint}</small>}
            {duplicateHint && <small className="form-hint">{duplicateHint}</small>}
          </div>
          <div className="form-field">
            <label>状态</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="pending">待看</option>
              <option value="viewed">已看</option>
              <option value="excluded">排除</option>
            </select>
          </div>
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
              <label>房东网络</label>
              <select value={form.internetProvidedAvailable ? 'yes' : 'no'} onChange={e => set('internetProvidedAvailable', e.target.value === 'yes')}>
                <option value="no">不提供</option>
                <option value="yes">提供</option>
              </select>
            </div>
            {form.internetProvidedAvailable && (
              <div className="form-field">
                <label>计费方式</label>
                <select value={form.internetProvidedBilling} onChange={e => set('internetProvidedBilling', e.target.value)}>
                  <option value="included">包网</option>
                  <option value="extra">额外收费</option>
                  <option value="unknown">不清楚</option>
                </select>
              </div>
            )}
            {form.internetProvidedAvailable && form.internetProvidedBilling === 'extra' && (
              <div className="form-field">
                <label>网络月费（元）</label>
                <input type="number" value={form.internetProvidedMonthlyFee} onChange={e => set('internetProvidedMonthlyFee', e.target.value)} />
              </div>
            )}
            {form.internetProvidedAvailable && (
              <div className="form-field">
                <label>下行带宽（Mbps）</label>
                <input type="number" value={form.internetProvidedBandwidthDownMbps} onChange={e => set('internetProvidedBandwidthDownMbps', e.target.value)} placeholder="可选" />
              </div>
            )}
            <div className="form-field">
              <label>支持自接</label>
              <select value={form.internetSelfInstallAllowed ? 'yes' : 'no'} onChange={e => set('internetSelfInstallAllowed', e.target.value === 'yes')}>
                <option value="no">不支持</option>
                <option value="yes">支持</option>
              </select>
            </div>
            {form.internetSelfInstallAllowed && (
              <div className="form-field">
                <label>你的运营商覆盖</label>
                <select value={form.internetSelfCarrierCoverage} onChange={e => set('internetSelfCarrierCoverage', e.target.value)}>
                  <option value="covered">覆盖</option>
                  <option value="not_covered">不覆盖</option>
                  <option value="unknown">不清楚</option>
                </select>
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
            <div className="form-field full-width">
              <label>媒体链接（TOS）</label>
              <div className="media-input-row">
                <textarea
                  value={mediaInput}
                  onChange={e => setMediaInput(e.target.value)}
                  rows={3}
                  placeholder="每行一个 URL，支持图片或视频链接"
                />
                <button type="button" className="btn-media-add" onClick={handleAddMediaUrls}>添加链接</button>
              </div>
              {form.mediaUrls.length > 0 && (
                <div className="media-url-list">
                  {form.mediaUrls.map(url => (
                    <div key={url} className="media-url-item">
                      <a href={url} target="_blank" rel="noreferrer">{url}</a>
                      <button type="button" onClick={() => handleRemoveMediaUrl(url)}>删除</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>

      <div className="form-footer">
        {submitError && <small className="form-hint error">{submitError}</small>}
        <button className="btn-cancel" onClick={onClose}>取消</button>
        <button className="btn-save" onClick={handleSubmit} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}

function calcDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => deg * Math.PI / 180
  const r = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return r * c
}

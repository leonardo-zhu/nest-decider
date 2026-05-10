import { useState } from 'react'
import { useAppContext } from '../AppContext'

interface HeaderProps {
  onAddProperty: () => void
}

export function Header({ onAddProperty }: HeaderProps) {
  const { targets, settings, setTempQuery, arrivalRangeMinutes, setArrivalRangeMinutes, showArrivalRange, setShowArrivalRange } = useAppContext()
  const [tempAddress, setTempAddress] = useState('')
  const [querying, setQuerying] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const activeTarget = targets.find(t => t.id === settings.activeTargetId)

  const handleTempQuery = async () => {
    if (!tempAddress.trim()) return
    // TODO: implement with AMap JS API directly
    setQuerying(true)
    try {
      // Placeholder — needs frontend AMap geocoding + transit
    } finally {
      setQuerying(false)
    }
  }

  return (
    <header className="header">
      {/* Title card */}
      <div className="header-section header-left">
        <div className="header-title">
          <h1>租房对比地图工具</h1>
          <span className="header-subtitle">🌿 我的租房决策小帮手 🌿</span>
        </div>
      </div>

      {/* Target card */}
      {activeTarget && (
        <div className="header-section header-target">
          <div className="target-icon">🏢</div>
          <div className="target-info">
            <div className="target-label">当前目标地点（固定）</div>
            <div className="target-name">{activeTarget.name}（{activeTarget.address}）</div>
            <div className="target-desc">固定目标，通勤时间已缓存</div>
          </div>
        </div>
      )}

      {/* Temp query card */}
      <div className="header-section header-center">
        <div className="temp-query-label">临时查询（一次性）</div>
        <div className="temp-query-input-row">
          <input
            type="text"
            className="temp-query-input"
            placeholder="输入地址，如机场、商圈等"
            value={tempAddress}
            onChange={e => setTempAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTempQuery()}
          />
          <button className="temp-query-btn" onClick={handleTempQuery} disabled={querying}>
            🔍
          </button>
        </div>
      </div>

      {/* Arrival controls */}
      <div className="header-section header-arrival">
        <div className="arrival-label">到达圈（公交）</div>
        <div className="arrival-controls">
          <select
            className="arrival-select"
            value={arrivalRangeMinutes}
            onChange={e => setArrivalRangeMinutes(Number(e.target.value))}
          >
            {[15, 20, 30, 45, 60, 90].map(m => (
              <option key={m} value={m}>{m} 分钟</option>
            ))}
          </select>
          <label className="arrival-toggle">
            <input
              type="checkbox"
              checked={showArrivalRange}
              onChange={e => setShowArrivalRange(e.target.checked)}
            />
            <span className="toggle-label">显示到达圈</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="header-actions">
        <button className="btn-more" onClick={() => setShowMore(!showMore)}>
          ⋮ 更多
        </button>
        <button className="btn-add-property" onClick={onAddProperty}>
          ＋ 添加房源
        </button>
      </div>
    </header>
  )
}

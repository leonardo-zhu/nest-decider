import type { Target, TempQueryResult } from '../types'

interface StatusBarProps {
  activeTarget?: Target
  tempQuery: TempQueryResult | null
  onClearTempQuery: () => void
}

export function StatusBar({ activeTarget, tempQuery, onClearTempQuery }: StatusBarProps) {
  const displayName = tempQuery?.name ?? activeTarget?.name
  const displayAddress = tempQuery?.address ?? activeTarget?.address

  if (!displayName) return null

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-bar-icon">📍</span>
        <span>
          当前显示到：<strong>{displayName}</strong>
          {displayAddress && displayAddress !== displayName && `（${displayAddress}）`}
          {' '}的通勤时间
        </span>
      </div>
      <div className="status-bar-right">
        {tempQuery && (
          <button className="status-bar-clear" onClick={onClearTempQuery}>
            清除临时查询
          </button>
        )}
        <button className="status-bar-switch">
          切换目标地点 🔀
        </button>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from './api/client'
import type { Property, Target, Settings } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const errMsg = typeof body.error === 'object' ? body.error.message ?? JSON.stringify(body.error) : body.error
    throw new Error(errMsg ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// Properties
export function useProperties() {
  const [data, setData] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const rows = await request<Property[]>('/properties')
    setData(rows)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const create = useCallback(async (payload: Partial<Property>) => {
    const p = await request<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setData(prev => [...prev, p])
    return p
  }, [])

  const update = useCallback(async (id: string, payload: Partial<Property>) => {
    const p = await request<Property>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setData(prev => prev.map(item => item.id === id ? p : item))
    return p
  }, [])

  const remove = useCallback(async (id: string) => {
    await request(`/properties/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(item => item.id !== id))
  }, [])

  return { data, loading, refresh, create, update, remove }
}

// Targets
export function useTargets() {
  const [targets, setTargets] = useState<Target[]>([])
  const [settings, setSettings] = useState<Settings>({ activeTargetId: null })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const res = await request<{ targets: Target[]; settings: Settings }>('/targets')
    setTargets(res.targets)
    setSettings(res.settings)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const create = useCallback(async (payload: Partial<Target>) => {
    const t = await request<Target>('/targets', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setTargets(prev => [...prev, t])
    return t
  }, [])

  const update = useCallback(async (id: string, payload: Partial<Target>) => {
    const t = await request<Target>(`/targets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setTargets(prev => prev.map(item => item.id === id ? t : item))
    return t
  }, [])

  const remove = useCallback(async (id: string) => {
    await request(`/targets/${id}`, { method: 'DELETE' })
    setTargets(prev => prev.filter(item => item.id !== id))
    setSettings(prev => prev.activeTargetId === id ? { activeTargetId: null } : prev)
  }, [])

  const setActive = useCallback(async (id: string | null) => {
    await request('/targets/active', {
      method: 'PUT',
      body: JSON.stringify({ activeTargetId: id }),
    })
    setSettings({ activeTargetId: id })
  }, [])

  return { targets, settings, loading, refresh, create, update, remove, setActive }
}

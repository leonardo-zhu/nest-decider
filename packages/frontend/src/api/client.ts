const explicitBase = import.meta.env.VITE_API_BASE_URL as string | undefined

export const apiBaseUrl = explicitBase ?? 'https://rent.leonardo-zhu.me/api'

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}${normalized}`
}

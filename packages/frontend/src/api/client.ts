const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8787/api'

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}${normalized}`
}

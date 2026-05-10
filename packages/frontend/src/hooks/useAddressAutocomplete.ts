import { useEffect, useState } from 'react'

interface UseAddressAutocompleteOptions {
  value: string
  enabled?: boolean
  delayMs?: number
}

export function useAddressAutocomplete({ value, enabled = true, delayMs = 600 }: UseAddressAutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<AMap.AutoCompleteResultItem[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const keyword = value.trim()
    if (!enabled || !keyword || !window.AMap) {
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
          setSuggestions(result.tips.filter(t => !!t.location))
        })
      })
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [value, enabled, delayMs])

  return { suggestions, searching, setSuggestions }
}

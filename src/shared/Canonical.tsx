import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * <link rel="canonical"> till samma sida på restaurangens egen domän
 * (booqy.json, environments.prod.domain), också på förhandsvisningen i dev:
 * sökmotorer ska bara känna till den riktiga adressen.
 */
export function Canonical({ origin }: { origin: string | undefined }) {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!origin) return
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = origin + pathname
  }, [origin, pathname])
  return null
}

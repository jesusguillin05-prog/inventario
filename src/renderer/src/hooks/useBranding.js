import { useEffect, useState } from 'react'
import { defaultBranding } from '../utils/branding'

export function useBranding() {
  const [branding, setBranding] = useState(() => {
    if (typeof window === 'undefined') return defaultBranding

    try {
      const stored = JSON.parse(window.localStorage.getItem('inventario-branding') || 'null')
      return stored ? { ...defaultBranding, ...stored } : defaultBranding
    } catch {
      return defaultBranding
    }
  })

  useEffect(() => {
    window.localStorage.setItem('inventario-branding', JSON.stringify(branding))
  }, [branding])

  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--primary', branding.primaryColor)
    root.setProperty('--primary-strong', branding.secondaryColor)
    root.setProperty('--bg-1', branding.backgroundColor)
    root.setProperty('--bg-2', branding.backgroundColor)
    root.setProperty('--text', branding.textColor)
  }, [branding])

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setBranding((current) => ({ ...current, logoDataUrl: String(reader.result || '') }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleResetBranding = () => {
    setBranding(defaultBranding)
  }

  return {
    branding,
    setBranding,
    handleLogoUpload,
    handleResetBranding
  }
}

export const pad = (n) => String(n).padStart(2, '0')

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const thisMonth = () => today().slice(0, 7)

export const monthLabel = (month) => {
  const [y, m] = String(month).split('-').map(Number)
  if (!y || !m) return ''
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric'
  })
}

export const formatMoney = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

export const formatNumber = (value) => Number(value || 0).toLocaleString('es-CO')

export const normalizeInputValue = (value) => (value === undefined || value === null ? '' : value)

export const formatMoneyInput = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  const digits = String(value).replace(/[^\d]/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('es-CO')
}

export const parseMoneyInput = (value) => String(value ?? '').replace(/[^\d]/g, '')

export const errorMessage = (error, fallback) =>
  (error?.message || fallback).replace(/^Error invoking remote method '[^']+': (Error: )?/, '')

export const looksLikeError = (message) =>
  /no se pudo|error|insuficiente|obligatori|completa|primero|selecciona|escribe|debe|tiene ventas/i.test(
    message
  )

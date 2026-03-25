const DEFAULT_API_ORIGIN = 'https://splitora-api.onrender.com'

const normalizeOrigin = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return DEFAULT_API_ORIGIN

  const fixedTypo = raw
    .replace('onrende.com', 'onrender.com')
    .replace('onrende.', 'onrender.')
  const withProtocol = /^https?:\/\//i.test(fixedTypo) ? fixedTypo : `https://${fixedTypo}`
  const trimmed = withProtocol.replace(/\/+$/, '')
  const withoutApiSuffix = trimmed.replace(/\/api$/i, '')
  return withoutApiSuffix
}

export const API_ORIGIN = normalizeOrigin(import.meta.env.VITE_API_URL)
export const API_BASE_URL = `${API_ORIGIN}/api`

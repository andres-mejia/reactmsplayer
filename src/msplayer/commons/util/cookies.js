import cookies from 'browser-cookies'

export function getCookie(key) {
  if(typeof document === 'undefined') return null
  return cookies.get(key)
}

export function setCookie(key, value) {
  if(typeof document === 'undefined') return null
  return cookies.set(key, value)
}

export function removeCookie(key) {
  if(typeof document === 'undefined') return null
  return cookies.erase(key)
}

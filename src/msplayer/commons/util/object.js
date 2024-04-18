export function isEmpty(value = {}) {
  if (Object.entries(value).length === 0) {
    return true
  }
  return false
}

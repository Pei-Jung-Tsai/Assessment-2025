// Returns an empty string for null/undefined.
export function clampText(s, max = 100) {
  return String(s ?? '')
    .trim()
    .slice(0, max)
}
// Returns true only if URL parses and uses https: scheme.
export function isSafeHttpsUrl(u) {
  if (!u) return false
  try {
    const url = new URL(u)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}
// Returns `null` if the value is not a valid integer in range.
export function toPositiveInt(n, min = 1, max = 600) {
  const v = Number(n)
  return Number.isInteger(v) && v >= min && v <= max ? v : null
}
// Returns the integer if valid, otherwise null.
export function ratingInt(n) {
  const v = Number(n)
  return Number.isInteger(v) && v >= 1 && v <= 5 ? v : null
}

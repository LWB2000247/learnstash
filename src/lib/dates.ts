export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(now = new Date()): string {
  return formatDate(now)
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}

export function addDays(iso: string, days: number): string {
  const date = parseDate(iso)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

export function formatDayShort(iso: string): string {
  return parseDate(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

export function lastDates(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(today, index - (count - 1)))
}

export function dayLabel(days: number): string {
  return days === 1 ? '1 Tag' : `${days} Tage`
}

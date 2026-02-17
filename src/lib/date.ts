export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false
  return new Date(iso).getTime() < Date.now()
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return '방금'
  if (s < 3600) return `${Math.floor(s / 60)}분 전`
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`
  return `${Math.floor(s / 86400)}일 전`
}

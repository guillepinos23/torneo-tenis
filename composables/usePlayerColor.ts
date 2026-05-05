// composables/usePlayerColor.ts
export function usePlayerColor() {
  function getColor(id: string): string {
    const hue = (id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 47 + 80) % 360
    return `hsl(${hue}, 65%, 52%)`
  }
  return { getColor }
}

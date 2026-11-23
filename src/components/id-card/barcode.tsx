/**
 * Code 128 (set B) barcode as an SVG, so ID numbers can be scanned.
 * Shared by the school, staff and student portals (keep the copies in step).
 */

// Bar/space widths for symbols 0–106 (106 = stop).
const PATTERNS = (
  '212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 ' +
  '123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 ' +
  '232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 ' +
  '313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 ' +
  '111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 ' +
  '111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 ' +
  '114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112'
).split(' ')

const START_B = 104
const STOP = 106
const QUIET = 10

/** Bar widths (alternating bar, space, …) in modules, including quiet zones. */
export function code128(value: string): Array<number> {
  // Set B covers printable ASCII; anything else becomes "?".
  const codes = Array.from(value).map((ch) => {
    const c = ch.charCodeAt(0)
    return c >= 32 && c <= 127 ? c - 32 : 31
  })
  const check = codes.reduce((sum, c, i) => sum + c * (i + 1), START_B) % 103
  const symbols = [START_B, ...codes, check, STOP]
  return symbols.flatMap((s) => Array.from(PATTERNS[s]).map(Number))
}

export function Barcode({
  value,
  height = 28,
  color = '#111827',
  className,
}: {
  value: string
  height?: number
  color?: string
  className?: string
}) {
  const widths = code128(value)
  const total = widths.reduce((a, b) => a + b, 0) + QUIET * 2
  let x = QUIET
  const bars: Array<{ x: number; w: number }> = []
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push({ x, w })
    x += w
  })
  return (
    <svg
      viewBox={`0 0 ${total} ${height}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={className}
      style={{ width: '100%', height, display: 'block' }}
      role="img"
      aria-label={`Barcode ${value}`}
    >
      <rect width={total} height={height} fill="#fff" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} fill={color} />
      ))}
    </svg>
  )
}

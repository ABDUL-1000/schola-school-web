/**
 * Print (or "Save as PDF") on A4, one page per element.
 *
 * Each element is copied into a print-only container sized to the printable
 * area of an A4 sheet, then shrunk with CSS zoom until it fits — so a report
 * card with 20 subjects still comes out as one page. Pass several elements
 * (e.g. every class's timetable) to get one page each in a single PDF.
 * Everything else on the screen (sidebar, dialogs, buttons) is left out.
 */
const PX_PER_MM = 96 / 25.4
const MARGIN_MM = 8
const ROOT_ID = 'a4-print-root'
const STYLE_ID = 'a4-print-style'

let restoreTitle: string | null = null

function cleanup() {
  document.getElementById(ROOT_ID)?.remove()
  document.getElementById(STYLE_ID)?.remove()
  if (restoreTitle !== null) {
    document.title = restoreTitle
    restoreTitle = null
  }
}

export function printA4(
  target: HTMLElement | Array<HTMLElement> | null,
  opts: { landscape?: boolean; title?: string } = {},
) {
  const elements = (Array.isArray(target) ? target : [target]).filter((e): e is HTMLElement => !!e)
  if (!elements.length) return
  cleanup()

  const [pageW, pageH] = opts.landscape ? [297, 210] : [210, 297]
  const areaW = (pageW - MARGIN_MM * 2) * PX_PER_MM
  // A little slack so rounding never spills onto an extra page.
  const areaH = (pageH - MARGIN_MM * 2) * PX_PER_MM * 0.97

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @page { size: A4 ${opts.landscape ? 'landscape' : 'portrait'}; margin: ${MARGIN_MM}mm; }
    #${ROOT_ID} { position: absolute; left: -100000px; top: 0; background: #fff; color: #000; }
    #${ROOT_ID} .overflow-x-auto, #${ROOT_ID} .overflow-auto { overflow: visible !important; }
    #${ROOT_ID} .a4-page > * { margin: 0 !important; max-width: none !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
    #${ROOT_ID} .a4-page { overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
    #${ROOT_ID} .a4-page:not(:last-child) { break-after: page; page-break-after: always; }
    @media print {
      html, body { background: #fff !important; height: auto !important; min-height: 0 !important; overflow: visible !important; }
      body > *:not(#${ROOT_ID}) { display: none !important; }
      #${ROOT_ID} { position: static; left: 0; }
      #${ROOT_ID}, #${ROOT_ID} * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }`
  document.head.appendChild(style)

  const root = document.createElement('div')
  root.id = ROOT_ID
  document.body.appendChild(root)

  for (const el of elements) {
    const page = document.createElement('div')
    page.className = 'a4-page'
    const copy = el.cloneNode(true) as HTMLElement
    copy.style.padding = '0'
    // Keep tables as tables (phones show some of them as cards).
    copy.querySelectorAll('[data-cards]').forEach((t) => t.removeAttribute('data-cards'))
    page.appendChild(copy)
    root.appendChild(page)

    // Shrink to fit. A smaller zoom gives the layout a wider "virtual" page,
    // which changes its height, so settle it over a few passes.
    // (Measured before zoom is applied, so sizes are in layout px.)
    let zoom = 1
    for (let i = 0; i < 4; i++) {
      copy.style.width = `${areaW / zoom}px`
      const next = Math.max(0.3, Math.min(1, areaH / copy.scrollHeight, areaW / copy.scrollWidth))
      if (Math.abs(next - zoom) < 0.005) break
      zoom = Math.min(zoom, next)
    }
    copy.style.width = `${areaW / zoom}px`
    page.style.zoom = String(zoom)
    page.style.width = `${areaW / zoom}px`
    page.style.height = `${areaH / zoom}px`
  }

  if (opts.title) {
    restoreTitle = document.title
    document.title = opts.title // becomes the suggested PDF file name
  }
  window.addEventListener('afterprint', cleanup, { once: true })
  // Let images in the copy (logo, photo) paint before the print dialog opens.
  setTimeout(() => window.print(), 150)
}

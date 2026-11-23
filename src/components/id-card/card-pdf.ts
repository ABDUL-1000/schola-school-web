/**
 * Turn rendered ID card sheets into a downloadable PDF, with no extra libraries.
 *
 * Each sheet is drawn to a canvas through an SVG <foreignObject> (the card faces
 * use inline styles only, so they render the same as on screen), saved as JPEG,
 * and placed on its own A4 page of a small hand-written PDF.
 *
 * Shared by the school, staff and student portals (keep the copies in step).
 */

const A4_W = 595.28 // pt (portrait)
const A4_H = 841.89
const PT_PER_PX = 72 / 96
const TOP_MARGIN_PT = (8 / 25.4) * 72
/** Pixel density of the images: 2.5 × 96 = 240 dpi, sharp in print, small enough for big classes. */
const SCALE = 2.5

const dataUrlCache = new Map<string, Promise<string | null>>()

function toDataUrl(src: string): Promise<string | null> {
  if (src.startsWith('data:')) return Promise.resolve(src)
  let hit = dataUrlCache.get(src)
  if (!hit) {
    hit = fetch(src, { mode: 'cors', cache: 'force-cache' })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then(
        (blob) =>
          new Promise<string | null>((resolve) => {
            const fr = new FileReader()
            fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : null)
            fr.onerror = () => resolve(null)
            fr.readAsDataURL(blob)
          }),
      )
      .catch(() => null)
    dataUrlCache.set(src, hit)
  }
  return hit
}

const fontCssCache = new Map<string, Promise<string>>()

/**
 * Web fonts don't load inside the SVG used for drawing, so fetch the font file
 * itself (Latin letters only, to keep the PDF small) and inline it.
 */
function embeddedFontCss(cssUrl: string): Promise<string> {
  let hit = fontCssCache.get(cssUrl)
  if (!hit) {
    hit = fetch(cssUrl)
      .then((r) => (r.ok ? r.text() : ''))
      .then(async (css) => {
        // Google Fonts labels each block with its letters: /* latin */ @font-face {…}
        const blocks = css.split(/\/\*\s*([\w-]+)\s*\*\//).reduce<Array<string>>((acc, part, i, all) => {
          if (i % 2 === 1 && part === 'latin') acc.push(all[i + 1])
          return acc
        }, [])
        const keep = blocks.length ? blocks : [css]
        const out = await Promise.all(
          keep.map(async (block) => {
            const m = /url\(([^)]+)\)/.exec(block)
            if (!m) return block
            const data = await toDataUrl(m[1].replace(/["']/g, ''))
            return data ? block.replace(m[0], `url(${data})`) : ''
          }),
        )
        return out.join('\n')
      })
      .catch(() => '')
    fontCssCache.set(cssUrl, hit)
  }
  return hit
}

/** Draw one element to a JPEG. Images that can't be fetched are left out rather than failing the PDF. */
async function rasterize(el: HTMLElement, scale: number, fontCss: string): Promise<{ bytes: Uint8Array; w: number; h: number; scale: number }> {
  const w = Math.ceil(el.offsetWidth)
  const h = Math.ceil(el.offsetHeight)
  const copy = el.cloneNode(true) as HTMLElement
  copy.style.margin = '0'
  copy.style.width = `${w}px`
  if (fontCss) {
    const style = document.createElement('style')
    style.textContent = fontCss
    copy.prepend(style)
  }

  await Promise.all(
    Array.from(copy.querySelectorAll('img')).map(async (img) => {
      const src = img.getAttribute('src')
      const url = src ? await toDataUrl(new URL(src, location.href).href) : null
      if (url) img.setAttribute('src', url)
      else img.remove()
    }),
  )

  const xhtml = new XMLSerializer().serializeToString(copy)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<foreignObject x="0" y="0" width="100%" height="100%">${xhtml}</foreignObject></svg>`

  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const g = canvas.getContext('2d')
  if (!g) throw new Error('Canvas is not available')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, canvas.width, canvas.height)
  g.drawImage(image, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.9))
  if (!blob) throw new Error('Could not draw the card')
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w, h, scale }
}

type Raster = { bytes: Uint8Array; w: number; h: number; scale: number }

/** A minimal PDF: one A4 page per JPEG, centred across, `margin` from the top, at real size. */
function buildPdf(images: Array<Raster>, landscape: boolean | 'auto', margin: number): Blob {
  const enc = new TextEncoder()
  const parts: Array<Uint8Array> = []
  const offsets: Array<number> = []
  let length = 0
  const push = (p: Uint8Array | string) => {
    const b = typeof p === 'string' ? enc.encode(p) : p
    parts.push(b)
    length += b.length
  }
  const obj = (n: number, body: Array<Uint8Array | string>) => {
    offsets[n] = length
    push(`${n} 0 obj\n`)
    body.forEach(push)
    push('\nendobj\n')
  }

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  // 1 = catalog, 2 = page tree, then 3 objects per page: page, contents, image.
  const pageIds = images.map((_, i) => 3 + i * 3)
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>'])
  obj(2, [`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${images.length} >>`])

  images.forEach((img, i) => {
    const [pageId, contentId, imageId] = [pageIds[i], pageIds[i] + 1, pageIds[i] + 2]
    const wide = landscape === 'auto' ? img.w > img.h : landscape
    const [pageW, pageH] = wide ? [A4_H, A4_W] : [A4_W, A4_H]
    let dw = img.w * PT_PER_PX
    let dh = img.h * PT_PER_PX
    // Never spill off the page (cards stay real size in every normal layout).
    const fit = Math.min(1, (pageW - 2 * margin) / dw, (pageH - 2 * margin) / dh)
    dw *= fit
    dh *= fit
    const x = (pageW - dw) / 2
    const y = pageH - margin - dh
    const content = `q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`

    obj(pageId, [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
        `/Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    ])
    obj(contentId, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`])
    obj(imageId, [
      `<< /Type /XObject /Subtype /Image /Width ${Math.round(img.w * img.scale)} /Height ${Math.round(img.h * img.scale)} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`,
      img.bytes,
      '\nendstream',
    ])
  })

  const total = 3 + images.length * 3
  const xref = length
  push(`xref\n0 ${total}\n0000000000 65535 f \n`)
  for (let n = 1; n < total; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
  return new Blob(parts as Array<BlobPart>, { type: 'application/pdf' })
}

export interface PdfOptions {
  /** A4 landscape pages, or 'auto' to turn each page to suit its sheet (certificates). */
  landscape?: boolean | 'auto'
  /** Space from the page edge, in points. Default 8 mm. */
  margin?: number
  /** Image sharpness: pixels per CSS pixel. Default 2.5 (240 dpi). */
  scale?: number
  /** A Google Fonts stylesheet the sheets use, embedded so the PDF keeps the lettering. */
  fontCss?: string
}

/** Build a PDF from the sheets (one per page) and download it. */
export async function downloadSheetsPdf(
  sheets: Array<HTMLElement>,
  fileName: string,
  onProgress?: (done: number, total: number) => void,
  opts: PdfOptions = {},
) {
  const fontCss = opts.fontCss ? await embeddedFontCss(opts.fontCss) : ''
  const images: Array<Raster> = []
  for (let i = 0; i < sheets.length; i++) {
    onProgress?.(i, sheets.length)
    images.push(await rasterize(sheets[i], opts.scale ?? SCALE, fontCss))
    // Let the page breathe between sheets on big classes.
    await new Promise((r) => setTimeout(r, 0))
  }
  onProgress?.(sheets.length, sheets.length)

  const url = URL.createObjectURL(buildPdf(images, opts.landscape ?? false, opts.margin ?? TOP_MARGIN_PT))
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'ID cards'}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

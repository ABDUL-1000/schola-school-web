import type { PrintableExam } from './exam-print.types'
import { pdfFileName, schoolAddress, schoolContacts, typeLabel } from './exam-print.types'

/**
 * The exam/test as a Word document (.docx) the teacher can edit, built in the
 * browser with no extra packages: a few XML files zipped together. Same content
 * as the printed/PDF paper (letterhead, details table, sections, options, marks,
 * and the marking guide when it's switched on).
 * Shared by the school and staff portals (keep the copies in step).
 */

// ── tiny zip writer (files stored, not compressed: Word opens them fine) ──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(b: Uint8Array) {
  let c = 0xffffffff
  for (const x of b) c = CRC_TABLE[(c ^ x) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function zip(files: Array<{ name: string; data: Uint8Array }>): Blob {
  const enc = new TextEncoder()
  const parts: Array<Uint8Array> = []
  const central: Array<Uint8Array> = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name)
    const crc = crc32(f.data)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(8, 0, true) // stored
    local.setUint32(14, crc, true)
    local.setUint32(18, f.data.length, true)
    local.setUint32(22, f.data.length, true)
    local.setUint16(26, name.length, true)
    parts.push(new Uint8Array(local.buffer), name, f.data)
    const cen = new DataView(new ArrayBuffer(46))
    cen.setUint32(0, 0x02014b50, true)
    cen.setUint16(4, 20, true)
    cen.setUint16(6, 20, true)
    cen.setUint32(16, crc, true)
    cen.setUint32(20, f.data.length, true)
    cen.setUint32(24, f.data.length, true)
    cen.setUint16(28, name.length, true)
    cen.setUint32(42, offset, true)
    central.push(new Uint8Array(cen.buffer), name)
    offset += 30 + name.length + f.data.length
  }
  const size = central.reduce((a, b) => a + b.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, size, true)
  end.setUint32(16, offset, true)
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)].map((p) => p.slice().buffer), {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

// ── WordprocessingML helpers ──
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const FONT = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>'

interface RunOpts {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  size?: number // points
  caps?: boolean
}
function run(text: string, o: RunOpts = {}) {
  const pr = `<w:rPr>${FONT}${o.bold ? '<w:b/>' : ''}${o.italic ? '<w:i/>' : ''}${o.underline ? '<w:u w:val="single"/>' : ''}${o.caps ? '<w:caps/>' : ''}<w:sz w:val="${(o.size ?? 12) * 2}"/></w:rPr>`
  // Keep line breaks and tabs from the question text.
  const pieces = text.split('\n').map((line) =>
    line
      .split('\t')
      .map((t) => `<w:t xml:space="preserve">${esc(t)}</w:t>`)
      .join('<w:tab/>'),
  )
  return `<w:r>${pr}${pieces.join('<w:br/>')}</w:r>`
}
interface ParaOpts {
  align?: 'left' | 'center' | 'right' | 'both'
  after?: number // points of space after
  before?: number
  indent?: number // twips from the left
  hanging?: number
  keepNext?: boolean
  tabs?: Array<number>
  border?: 'bottom' | 'box'
}
function para(runs: string, o: ParaOpts = {}) {
  const pr = [
    o.keepNext ? '<w:keepNext/>' : '',
    o.border === 'bottom' ? '<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="000000"/></w:pBdr>' : '',
    o.border === 'box'
      ? '<w:pBdr><w:top w:val="single" w:sz="6" w:space="2" w:color="000000"/><w:left w:val="single" w:sz="6" w:space="4" w:color="000000"/><w:bottom w:val="single" w:sz="6" w:space="2" w:color="000000"/><w:right w:val="single" w:sz="6" w:space="4" w:color="000000"/></w:pBdr>'
      : '',
    o.tabs?.length ? `<w:tabs>${o.tabs.map((t) => `<w:tab w:val="left" w:pos="${t}"/>`).join('')}</w:tabs>` : '',
    `<w:spacing w:before="${(o.before ?? 0) * 20}" w:after="${(o.after ?? 4) * 20}"/>`,
    o.indent || o.hanging ? `<w:ind w:left="${o.indent ?? 0}"${o.hanging ? ` w:hanging="${o.hanging}"` : ''}/>` : '',
    o.align ? `<w:jc w:val="${o.align}"/>` : '',
  ].join('')
  return `<w:p><w:pPr>${pr}</w:pPr>${runs}</w:p>`
}
const cell = (content: string, opts: { width: number; span?: number }) =>
  `<w:tc><w:tcPr><w:tcW w:w="${opts.width}" w:type="dxa"/>${opts.span ? `<w:gridSpan w:val="${opts.span}"/>` : ''}</w:tcPr>${content}</w:tc>`

/** The school logo as PNG (Word can't show WebP), sized for the letterhead. */
async function logoPng(url: string): Promise<{ data: Uint8Array; w: number; h: number } | null> {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    await img.decode()
    const scale = Math.min(1, 300 / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
    if (!blob) return null
    return { data: new Uint8Array(await blob.arrayBuffer()), w: canvas.width, h: canvas.height }
  } catch {
    return null
  }
}

function logoRun(w: number, h: number) {
  // Fit inside about 2 cm square. 1 cm = 360000 EMU.
  const box = 720000
  const s = Math.min(box / w, box / h)
  const cx = Math.round(w * s)
  const cy = Math.round(h * s)
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="Logo"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
}

export async function buildExamDocx(data: PrintableExam): Promise<Blob> {
  const { school, paper } = data
  const logo = school?.logo ? await logoPng(school.logo) : null
  const body: Array<string> = []

  // Letterhead
  if (logo) body.push(para(logoRun(logo.w, logo.h), { align: 'center', after: 2 }))
  body.push(para(run(school?.schoolName ?? '', { bold: true, size: 16, caps: true }), { align: 'center', after: 0 }))
  if (schoolAddress(school)) body.push(para(run(schoolAddress(school), { size: 9 }), { align: 'center', after: 0 }))
  if (schoolContacts(school)) body.push(para(run(schoolContacts(school), { size: 9 }), { align: 'center', after: 0 }))
  if (paper.branch?.name) body.push(para(run(paper.branch.name, { size: 9, italic: true }), { align: 'center', after: 0 }))
  body.push(para('', { border: 'bottom', after: 6 }))

  if (paper.term) body.push(para(run(`${paper.term.sessionName} Academic Session — ${paper.term.name}`, { bold: true, size: 11, caps: true }), { align: 'center', after: 2 }))
  body.push(para(run(`${typeLabel(paper.type)}: ${paper.title}`, { bold: true, size: 13, underline: true, caps: true }), { align: 'center', after: 8 }))

  // Details table: 4 equal columns over 9906 twips.
  const W = 2476
  const bold = (label: string, value: string) => para(run(`${label} `, { bold: true, size: 10 }) + run(value, { size: 10 }), { after: 0 })
  body.push(
    `<w:tbl><w:tblPr><w:tblW w:w="${W * 4}" w:type="dxa"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
      .map((b) => `<w:${b} w:val="single" w:sz="6" w:color="000000"/>`)
      .join('')}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${'<w:gridCol w:w="2476"/>'.repeat(4)}</w:tblGrid>` +
      `<w:tr>${cell(bold('Subject:', paper.subjectName), { width: W })}${cell(bold('Class:', paper.className), { width: W })}${cell(bold('Time:', paper.durationMinutes ? `${paper.durationMinutes} mins` : '—'), { width: W })}${cell(bold('Marks:', paper.totalMarks != null ? String(paper.totalMarks) : '—'), { width: W })}</w:tr>` +
      `<w:tr>${cell(bold('Name:', '_____________________________________________'), { width: W * 3, span: 3 })}${cell(bold('Reg. No:', '__________'), { width: W })}</w:tr></w:tbl>`,
  )
  body.push(para('', { after: 4 }))

  if (paper.showAnswers) body.push(para(run('MARKING GUIDE — NOT FOR STUDENTS', { bold: true, size: 10 }), { align: 'center', border: 'box', after: 6 }))
  if (paper.instructions) body.push(para(run('INSTRUCTIONS: ', { bold: true, size: 10 }) + run(paper.instructions, { size: 10 }), { after: 6 }))

  let n = 0
  for (const section of paper.sections) {
    body.push(para(run(section.title, { bold: true, size: 12, caps: true }), { before: 8, after: 2, keepNext: true }))
    if (section.instructions) body.push(para(run(section.instructions, { italic: true, size: 10 }), { after: 4, keepNext: true }))
    for (const q of section.questions) {
      n += 1
      const marks = q.marks ? `\t[${q.marks}]` : ''
      body.push(para(run(`${n}.\t`, { bold: true }) + run(q.text) + (marks ? run(marks, { size: 10 }) : ''), { indent: 454, hanging: 454, after: q.options.length ? 2 : 6, keepNext: q.options.length > 0, tabs: [454, 9400] }))
      // Two options per line.
      for (let i = 0; i < q.options.length; i += 2) {
        const pair = q.options.slice(i, i + 2).map((o, j) => {
          const right = paper.showAnswers && q.answer === o
          return run(`(${String.fromCharCode(97 + i + j)}) ${o}`, { bold: right, underline: right })
        })
        const last = i + 2 >= q.options.length
        body.push(para(pair.join(run('\t')), { indent: 454, tabs: [5200], after: last ? 6 : 0, keepNext: !last }))
      }
      if (paper.showAnswers && q.answer && q.options.length === 0) body.push(para(run('Answer: ', { bold: true, italic: true, size: 10 }) + run(q.answer, { italic: true, size: 10 }), { indent: 454, after: 6 }))
    }
  }
  body.push(para(run(`${paper.subjectName} · ${paper.className} · Set by ${paper.teacherName} · ${school?.schoolName ?? ''}`, { size: 8 }), { align: 'center', before: 18 }))

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`

  const enc = new TextEncoder()
  const files: Array<{ name: string; data: Uint8Array }> = [
    {
      name: '[Content_Types].xml',
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
      ),
    },
    {
      name: '_rels/.rels',
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
      ),
    },
    {
      name: 'word/_rels/document.xml.rels',
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${logo ? '<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>' : ''}</Relationships>`,
      ),
    },
    { name: 'word/document.xml', data: enc.encode(document) },
  ]
  if (logo) files.push({ name: 'word/media/logo.png', data: logo.data })
  return zip(files)
}

export async function downloadExamDocx(data: PrintableExam) {
  const blob = await buildExamDocx(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = pdfFileName(data.paper).replace(/\.pdf$/, '.docx')
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

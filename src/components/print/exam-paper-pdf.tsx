// Loaded on demand (dynamic import) so @react-pdf stays out of the main bundle.
import { Document, Image, Link, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import type { PrintableExam } from './exam-print.types'
import { pdfFileName, schoolAddress, schoolContacts, typeLabel } from './exam-print.types'

const s = StyleSheet.create({
  // Text styles live on `body`, not the Page: page-level text styles stop the fixed footer rendering.
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40 },
  body: { fontSize: 10.5, fontFamily: 'Helvetica', lineHeight: 1.4 },
  letterhead: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#000', paddingBottom: 8 },
  logo: { width: 60, height: 60, objectFit: 'contain' },
  logoSpace: { width: 60, height: 60 },
  headText: { flex: 1, alignItems: 'center' },
  schoolName: { fontSize: 16, lineHeight: 1.2, marginBottom: 3, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'center' },
  small: { fontSize: 9, textAlign: 'center' },
  period: { marginTop: 8, fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'center', textTransform: 'uppercase' },
  title: { marginTop: 2, fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center', textTransform: 'uppercase', textDecoration: 'underline' },
  infoRow: { flexDirection: 'row', borderLeftWidth: 1, borderTopWidth: 1, borderColor: '#000' },
  infoCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', padding: 4, fontSize: 9 },
  bold: { fontFamily: 'Helvetica-Bold' },
  guide: { marginTop: 8, borderWidth: 1, borderColor: '#000', padding: 3, fontSize: 9, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  instructions: { marginTop: 8, fontSize: 9.5 },
  sectionTitle: { marginTop: 12, fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  sectionNote: { fontSize: 9, fontFamily: 'Helvetica-Oblique' },
  question: { flexDirection: 'row', marginTop: 7 },
  qNum: { width: 20, fontFamily: 'Helvetica-Bold' },
  qBody: { flex: 1 },
  qHead: { flexDirection: 'row', justifyContent: 'space-between' },
  qText: { flex: 1, paddingRight: 8 },
  marks: { fontSize: 9 },
  options: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  option: { width: '50%', paddingRight: 8 },
  answer: { marginTop: 2, fontSize: 9, fontFamily: 'Helvetica-Oblique' },
  footerRule: { position: 'absolute', bottom: 32, left: 40, right: 40, height: 0.5, backgroundColor: '#000' },
  // Own lineHeight: inheriting the page's makes react-pdf drop absolutely-positioned text.
  footer: { position: 'absolute', bottom: 18, left: 40, right: 40, fontSize: 8, lineHeight: 1, textAlign: 'center' },
})

export function ExamPdf({ data, logo }: { data: PrintableExam; logo: string | null }) {
  const { school, paper } = data
  let n = 0
  return (
    <Document title={paper.title} author={school?.schoolName || 'Schola'} subject={`${paper.subjectName} — ${paper.className}`}>
      <Page size="A4" style={s.page} wrap>
        <View style={s.body}>
        <View style={s.letterhead}>
          {logo ? <Image src={logo} style={s.logo} /> : <View style={s.logoSpace} />}
          <View style={s.headText}>
            <Text style={s.schoolName}>{school?.schoolName}</Text>
            {schoolAddress(school) ? <Text style={s.small}>{schoolAddress(school)}</Text> : null}
            {schoolContacts(school) ? <Text style={s.small}>{schoolContacts(school)}</Text> : null}
            {paper.branch?.name ? <Text style={s.small}>{paper.branch.name}</Text> : null}
          </View>
          <View style={s.logoSpace} />
        </View>

        {paper.term ? (
          <Text style={s.period}>{paper.term.sessionName} Academic Session — {paper.term.name}</Text>
        ) : null}
        <Text style={s.title}>{typeLabel(paper.type)}: {paper.title}</Text>

        <View style={[s.infoRow, { marginTop: 8 }]}>
          <Text style={s.infoCell}><Text style={s.bold}>Subject: </Text>{paper.subjectName}</Text>
          <Text style={s.infoCell}><Text style={s.bold}>Class: </Text>{paper.className}</Text>
          <Text style={s.infoCell}><Text style={s.bold}>Time: </Text>{paper.durationMinutes ? `${paper.durationMinutes} mins` : '—'}</Text>
          <Text style={s.infoCell}><Text style={s.bold}>Marks: </Text>{paper.totalMarks ?? '—'}</Text>
        </View>
        <View style={[s.infoRow, { borderTopWidth: 0 }]}>
          <Text style={[s.infoCell, { flex: 3, paddingVertical: 7 }]}><Text style={s.bold}>Name: </Text>____________________________________________</Text>
          <Text style={[s.infoCell, { paddingVertical: 7 }]}><Text style={s.bold}>Reg. No: </Text>__________</Text>
        </View>

        {paper.showAnswers ? <Text style={s.guide}>MARKING GUIDE — NOT FOR STUDENTS</Text> : null}
        {paper.instructions ? (
          <Text style={s.instructions}><Text style={s.bold}>INSTRUCTIONS: </Text>{paper.instructions}</Text>
        ) : null}
        {paper.attachment ? (
          <Text style={s.instructions}>
            Attached file: <Link src={paper.attachment.url}>{paper.attachment.name || paper.attachment.url}</Link>
          </Text>
        ) : null}

        {paper.sections.map((section, si) => (
          <View key={si}>
            <Text style={s.sectionTitle} minPresenceAhead={40}>{section.title}</Text>
            {section.instructions ? <Text style={s.sectionNote}>{section.instructions}</Text> : null}
            {section.questions.map((q, qi) => {
              n += 1
              return (
                <View key={qi} style={s.question} wrap={false}>
                  <Text style={s.qNum}>{n}.</Text>
                  <View style={s.qBody}>
                    <View style={s.qHead}>
                      <Text style={s.qText}>{q.text}</Text>
                      {q.marks ? <Text style={s.marks}>[{q.marks}]</Text> : null}
                    </View>
                    {q.options.length > 0 ? (
                      <View style={s.options}>
                        {q.options.map((o, oi) => (
                          <Text key={oi} style={[s.option, paper.showAnswers && q.answer === o ? s.bold : {}]}>
                            ({String.fromCharCode(97 + oi)}) {o}{paper.showAnswers && q.answer === o ? '  (answer)' : ''}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    {paper.showAnswers && q.answer && q.options.length === 0 ? (
                      <Text style={s.answer}>Answer: {q.answer}</Text>
                    ) : null}
                  </View>
                </View>
              )
            })}
          </View>
        ))}
        </View>

        <View style={s.footerRule} fixed />
        <Text style={s.footer} fixed>
          {paper.subjectName} · {paper.className} · {school?.schoolName || ''}
        </Text>
      </Page>
    </Document>
  )
}

/**
 * Fetch the logo and re-encode it as PNG so any format (WebP, SVG, GIF…) can
 * be embedded — react-pdf only reads PNG/JPEG. Returns null if the image host
 * blocks cross-origin reads; the PDF is then produced without the logo.
 */
async function logoDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new window.Image()
        el.onload = () => resolve(el)
        el.onerror = reject
        el.src = objectUrl
      })
      const size = 256
      const scale = Math.min(size / (img.naturalWidth || size), size / (img.naturalHeight || size), 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round((img.naturalWidth || size) * scale))
      canvas.height = Math.max(1, Math.round((img.naturalHeight || size) * scale))
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/png')
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  } catch {
    return null
  }
}

export async function downloadExamPdf(data: PrintableExam) {
  const logo = await logoDataUrl(data.school?.logo)
  const blob = await pdf(<ExamPdf data={data} logo={logo} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = pdfFileName(data.paper)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

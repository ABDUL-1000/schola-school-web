import type { ReactNode } from 'react'
import type { ReportModel } from '../model'
import type { ReportTemplate } from '../template'
import { textOn, tint } from '../template'
import { FooterNote, GradeKey, RatingKey, SchoolLogo, Signature, StudentPhoto, Watermark } from '../parts'

/** Colour header, soft panels and grade badges. */
export function ModernLayout({ m, t }: { m: ReportModel; t: ReportTemplate }) {
  const s = t.sections
  const accent = t.accentColor
  const onAccent = textOn(accent)
  const soft = tint(accent, 0.07)
  const line = tint(accent, 0.25)

  return (
    <div className="relative font-sans">
      <Watermark m={m} t={t} />
      <div className="relative space-y-4">
        {/* Header band */}
        <div className="rounded-xl px-5 py-4 flex items-center gap-4" style={{ background: accent, color: onAccent }}>
          {s.logo && (
            <div className="rounded-lg bg-white p-1.5 shrink-0">
              <SchoolLogo m={m} size={64} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold tracking-wide uppercase leading-tight">{m.school?.schoolName || 'School Name'}</h1>
            {t.motto && <p className="text-xs italic opacity-90">“{t.motto}”</p>}
            <p className="text-xs opacity-85">{m.address}</p>
            {m.contact && <p className="text-[11px] opacity-75">{m.contact}</p>}
          </div>
          {s.studentPhoto && (
            <div className="rounded-lg bg-white p-1 shrink-0">
              <StudentPhoto m={m} size={64} />
            </div>
          )}
        </div>
        <div className="text-center">
          <span
            className="inline-block rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ background: soft, color: accent, border: `1px solid ${line}` }}
          >
            {t.labels.title}
          </span>
        </div>

        {/* Student details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl p-4 text-xs" style={{ background: soft }}>
          <Field label="Student" value={m.student.fullname} big />
          <Field label="Reg No" value={m.student.regNumber || 'N/A'} />
          <Field label="Class" value={m.student.className} />
          <Field label="Gender" value={m.student.gender || 'N/A'} />
          <Field label="Session" value={m.term.sessionName || 'N/A'} />
          <Field label="Term" value={m.term.name} />
          {s.attendance && (
            <>
              <Field label="School Opened" value={m.reportSheet?.timesSchoolOpened ?? '-'} />
              <Field label="Present / Absent" value={`${m.reportSheet?.timesPresent ?? '-'} / ${m.reportSheet?.timesAbsent ?? '-'}`} />
            </>
          )}
        </div>

        {/* Subjects */}
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: line }}>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-center font-semibold" style={{ background: accent, color: onAccent }}>
                <th className="px-3 py-2 text-left">Subject</th>
                {m.caColumns.map((c) => (
                  <th key={c.slot} className="px-1.5 py-2">
                    {c.name}
                    {c.maxScore > 0 && <span className="block text-[9px] font-normal opacity-80">/{c.maxScore}</span>}
                  </th>
                ))}
                <th className="px-1.5 py-2">
                  CA<span className="block text-[9px] font-normal opacity-80">/{m.caMax}</span>
                </th>
                <th className="px-1.5 py-2">
                  {m.examName}
                  <span className="block text-[9px] font-normal opacity-80">/{m.examMax}</span>
                </th>
                <th className="px-1.5 py-2">
                  Total<span className="block text-[9px] font-normal opacity-80">/100</span>
                </th>
                <th className="px-1.5 py-2">Grade</th>
                {m.showSubjectPosition && <th className="px-1.5 py-2">Pos.</th>}
                {s.classAverage && <th className="px-1.5 py-2">Avg</th>}
                {s.highestLowest && (
                  <>
                    <th className="px-1.5 py-2">High</th>
                    <th className="px-1.5 py-2">Low</th>
                  </>
                )}
                {s.subjectRemarks && <th className="px-3 py-2 text-left">{t.labels.subjectRemark}</th>}
              </tr>
            </thead>
            <tbody>
              {m.subjects.map((sub, idx) => (
                <tr
                  key={sub.id || idx}
                  className="text-center border-t"
                  style={{ borderColor: line, background: idx % 2 ? soft : undefined }}
                >
                  <td className="px-3 py-1.5 text-left font-semibold text-gray-900">{sub.subjectName}</td>
                  {m.caColumns.map((c) => (
                    <td key={c.slot} className="px-1.5 py-1.5 text-gray-700">
                      {m.show(m.score(sub, c.slot))}
                    </td>
                  ))}
                  <td className="px-1.5 py-1.5 font-medium">{m.show(sub.caTotal)}</td>
                  <td className="px-1.5 py-1.5 font-medium">{m.show(sub.examTotal)}</td>
                  <td className="px-1.5 py-1.5 font-extrabold text-sm text-gray-900">{m.show(sub.totalScore)}</td>
                  <td className="px-1.5 py-1.5">
                    <GradeBadge grade={sub.grade} />
                  </td>
                  {m.showSubjectPosition && <td className="px-1.5 py-1.5 text-gray-700">{sub.subjectPositionFormatted || m.blank}</td>}
                  {s.classAverage && (
                    <td className="px-1.5 py-1.5 text-gray-500">{sub.classAverage > 0 ? Number(sub.classAverage).toFixed(1) : '-'}</td>
                  )}
                  {s.highestLowest && (
                    <>
                      <td className="px-1.5 py-1.5 text-gray-500">{m.show(sub.classHighest)}</td>
                      <td className="px-1.5 py-1.5 text-gray-500">{m.show(sub.classLowest)}</td>
                    </>
                  )}
                  {s.subjectRemarks && (
                    <td className="px-3 py-1.5 text-left italic text-gray-600 truncate max-w-[140px]">{sub.teacherRemark || '-'}</td>
                  )}
                </tr>
              ))}
              {m.subjects.length === 0 && (
                <tr>
                  <td colSpan={14} className="text-center p-4 text-gray-500">
                    No subject records entered yet for this term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary tiles */}
        {s.summary && (
          <div className={`grid grid-cols-3 ${m.showClassPosition ? 'sm:grid-cols-6' : 'sm:grid-cols-5'} gap-2`}>
            <Tile label="Obtainable" value={m.reportSheet?.totalScoreObtainable ?? '-'} soft={soft} />
            <Tile label="Obtained" value={m.reportSheet?.totalScoreObtained ?? '-'} soft={soft} />
            <Tile
              label="Average"
              value={m.reportSheet?.overallPercentage ? `${m.reportSheet.overallPercentage}%` : '-'}
              soft={soft}
            />
            {m.showClassPosition && (
              <Tile label="Position" value={m.reportSheet?.classPositionFormatted || m.blank} accent={accent} onAccent={onAccent} />
            )}
            <Tile label="In Class" value={m.reportSheet?.totalStudentsInClass ?? '-'} soft={soft} />
            <Tile label="Grade" value={m.reportSheet?.overallGrade ?? '-'} accent={accent} onAccent={onAccent} />
          </div>
        )}

        {s.gradeKey && <GradeKey m={m} className="rounded-lg px-3 py-1.5 text-center" />}

        {m.hasDomains && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {s.affective && m.affective.length > 0 && <Ratings title={t.labels.affective} rows={m.affective} accent={accent} soft={soft} />}
            {s.psychomotor && m.psychomotor.length > 0 && (
              <Ratings title={t.labels.psychomotor} rows={m.psychomotor} accent={accent} soft={soft} />
            )}
          </div>
        )}
        {m.hasDomains && s.ratingKey && <RatingKey className="text-center" />}

        {/* Remarks */}
        {(s.formTeacherRemark || s.principalRemark || s.nextTerm || s.signatures) && (
          <div className="rounded-xl border p-4 text-xs space-y-3" style={{ borderColor: line }}>
            {s.formTeacherRemark && <Remark label={`${t.labels.formTeacher}'s Remark`} text={m.reportSheet?.formTeacherRemark} accent={accent} />}
            {s.principalRemark && <Remark label={`${t.labels.principal}'s Remark`} text={m.reportSheet?.principalRemark} accent={accent} />}
            {(s.nextTerm || s.signatures) && (
              <div className="grid grid-cols-2 pt-2 border-t" style={{ borderColor: line }}>
                <div>
                  {s.nextTerm && (
                    <>
                      <span className="font-bold text-gray-700 block">{t.labels.nextTerm}:</span>
                      <span className="font-semibold" style={{ color: accent }}>
                        {m.nextTerm}
                      </span>
                    </>
                  )}
                </div>
                {s.signatures && <Signature m={m} t={t} />}
              </div>
            )}
          </div>
        )}

        <FooterNote t={t} />
      </div>
    </div>
  )
}

function Field({ label, value, big }: { label: string; value: ReactNode; big?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] uppercase tracking-wide text-gray-500">{label}</span>
      <span className={`block font-semibold text-gray-900 break-words ${big ? 'text-sm' : ''}`}>{value}</span>
    </div>
  )
}

function Tile({
  label,
  value,
  soft,
  accent,
  onAccent,
}: {
  label: string
  value: ReactNode
  soft?: string
  accent?: string
  onAccent?: string
}) {
  return (
    <div className="rounded-lg px-2 py-2 text-center" style={accent ? { background: accent, color: onAccent } : { background: soft }}>
      <span className={`block text-[9px] uppercase tracking-wide ${accent ? 'opacity-80' : 'text-gray-500'}`}>{label}</span>
      <span className={`block text-base font-extrabold ${accent ? '' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

function GradeBadge({ grade }: { grade?: string }) {
  if (!grade || grade === '-') return <span className="text-gray-400">-</span>
  const tone = grade.startsWith('A')
    ? 'bg-green-100 text-green-800'
    : grade.startsWith('F')
      ? 'bg-red-100 text-red-700'
      : grade.startsWith('B')
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-800'
  return <span className={`inline-block min-w-[28px] rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tone}`}>{grade}</span>
}

function Ratings({ title, rows, accent, soft }: { title: string; rows: Array<[string, number]>; accent: string; soft: string }) {
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: soft }}>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>
        {title}
      </div>
      <div className="space-y-1">
        {rows.map(([name, rating]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="flex-1 text-gray-800">{name}</span>
            <span className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="inline-block h-2 w-4 rounded-sm"
                  style={{ background: i <= Number(rating) ? accent : tint(accent, 0.15) }}
                />
              ))}
            </span>
            <span className="w-3 text-right font-bold text-gray-900">{rating}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Remark({ label, text, accent }: { label: string; text?: string | null; accent: string }) {
  return (
    <div className="border-l-4 pl-3" style={{ borderColor: accent }}>
      <span className="font-bold text-gray-700 block">{label}:</span>
      <p className="italic text-gray-900 mt-0.5 min-h-[1.25rem]">{text || ' '}</p>
    </div>
  )
}

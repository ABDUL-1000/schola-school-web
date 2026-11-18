import type { ReactNode } from 'react'
import type { ReportModel } from '../model'
import { gradeTone } from '../model'
import type { ReportTemplate } from '../template'
import { textOn, tint } from '../template'
import { FooterNote, GradeKey, SchoolLogo, Signature, StudentPhoto, Stars, Watermark } from '../parts'

/** Primary / Nursery: larger text, fewer score columns, star ratings. */
export function PrimaryLayout({ m, t }: { m: ReportModel; t: ReportTemplate }) {
  const s = t.sections
  const accent = t.accentColor
  const onAccent = textOn(accent)
  const soft = tint(accent, 0.08)
  const line = tint(accent, 0.35)

  return (
    <div className="relative text-[13px]">
      <Watermark m={m} t={t} />
      <div className="relative space-y-4">
        {/* Friendly header */}
        <div className="rounded-2xl border-4 p-4 text-center" style={{ borderColor: accent, background: soft }}>
          <div className="flex items-center justify-center gap-4">
            {s.logo && <SchoolLogo m={m} size={72} />}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: accent }}>
                {m.school?.schoolName || 'School Name'}
              </h1>
              {t.motto && <p className="text-sm italic text-gray-700">“{t.motto}”</p>}
              <p className="text-xs text-gray-600">{m.address}</p>
              {m.contact && <p className="text-[11px] text-gray-500">{m.contact}</p>}
            </div>
            {s.studentPhoto && <StudentPhoto m={m} size={72} />}
          </div>
          <div className="mt-2 inline-block rounded-full px-5 py-1 text-xs font-bold uppercase tracking-widest" style={{ background: accent, color: onAccent }}>
            {t.labels.title}
          </div>
        </div>

        {/* About the pupil */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 rounded-2xl border-2 p-4" style={{ borderColor: line }}>
          <Line label="Name" value={m.student.fullname} />
          <Line label="Class" value={m.student.className} />
          <Line label="Term" value={`${m.term.name} · ${m.term.sessionName || ''}`} />
          <Line label="Reg No" value={m.student.regNumber || 'N/A'} />
          <Line label="Gender" value={m.student.gender || 'N/A'} />
          {s.attendance && (
            <Line
              label="Attendance"
              value={`${m.reportSheet?.timesPresent ?? '-'} of ${m.reportSheet?.timesSchoolOpened ?? '-'} days`}
            />
          )}
        </div>

        {/* Subjects — totals only */}
        <div className="overflow-x-auto rounded-2xl border-2" style={{ borderColor: line }}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-center text-xs font-bold" style={{ background: accent, color: onAccent }}>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-2 py-2">CA ({m.caMax})</th>
                <th className="px-2 py-2">
                  {m.examName} ({m.examMax})
                </th>
                <th className="px-2 py-2">Total</th>
                <th className="px-2 py-2">Grade</th>
                {m.showSubjectPosition && <th className="px-2 py-2">Position</th>}
                {s.classAverage && <th className="px-2 py-2">Class Avg</th>}
                {s.highestLowest && (
                  <>
                    <th className="px-2 py-2">High</th>
                    <th className="px-2 py-2">Low</th>
                  </>
                )}
                {s.subjectRemarks && <th className="px-3 py-2 text-left">{t.labels.subjectRemark}</th>}
              </tr>
            </thead>
            <tbody>
              {m.subjects.map((sub, idx) => (
                <tr key={sub.id || idx} className="text-center border-t" style={{ borderColor: line }}>
                  <td className="px-3 py-2 text-left font-semibold text-gray-900">{sub.subjectName}</td>
                  <td className="px-2 py-2">{m.show(sub.caTotal)}</td>
                  <td className="px-2 py-2">{m.show(sub.examTotal)}</td>
                  <td className="px-2 py-2 text-base font-black">{m.show(sub.totalScore)}</td>
                  <td className={`px-2 py-2 font-black ${gradeTone(sub.grade)}`}>{sub.grade}</td>
                  {m.showSubjectPosition && <td className="px-2 py-2">{sub.subjectPositionFormatted || m.blank}</td>}
                  {s.classAverage && (
                    <td className="px-2 py-2 text-gray-600">{sub.classAverage > 0 ? Number(sub.classAverage).toFixed(1) : '-'}</td>
                  )}
                  {s.highestLowest && (
                    <>
                      <td className="px-2 py-2 text-gray-600">{m.show(sub.classHighest)}</td>
                      <td className="px-2 py-2 text-gray-600">{m.show(sub.classLowest)}</td>
                    </>
                  )}
                  {s.subjectRemarks && (
                    <td className="px-3 py-2 text-left italic text-gray-700">{sub.teacherRemark || sub.gradeRemark || '-'}</td>
                  )}
                </tr>
              ))}
              {m.subjects.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center p-4 text-gray-500">
                    No subject records entered yet for this term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {s.summary && (
          <div className="flex flex-wrap justify-center gap-3">
            <Bubble label="Total Score" value={`${m.reportSheet?.totalScoreObtained ?? '-'} / ${m.reportSheet?.totalScoreObtainable ?? '-'}`} soft={soft} accent={accent} />
            <Bubble label="Average" value={m.reportSheet?.overallPercentage ? `${m.reportSheet.overallPercentage}%` : '-'} soft={soft} accent={accent} />
            {m.showClassPosition && (
              <Bubble
                label="Position"
                value={`${m.reportSheet?.classPositionFormatted || m.blank}${m.reportSheet?.totalStudentsInClass ? ` of ${m.reportSheet.totalStudentsInClass}` : ''}`}
                soft={soft}
                accent={accent}
              />
            )}
            <Bubble label="Grade" value={m.reportSheet?.overallGrade ?? '-'} soft={soft} accent={accent} />
          </div>
        )}

        {s.gradeKey && <GradeKey m={m} className="text-center" />}

        {m.hasDomains && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {s.affective && m.affective.length > 0 && <StarList title={t.labels.affective} rows={m.affective} accent={accent} line={line} />}
            {s.psychomotor && m.psychomotor.length > 0 && <StarList title={t.labels.psychomotor} rows={m.psychomotor} accent={accent} line={line} />}
          </div>
        )}
        {m.hasDomains && s.ratingKey && (
          <p className="text-center text-[11px] text-gray-500">★★★★★ Excellent · ★★★★ Good · ★★★ Fair · ★★ Poor · ★ Very Poor</p>
        )}

        {(s.formTeacherRemark || s.principalRemark || s.nextTerm || s.signatures) && (
          <div className="rounded-2xl border-2 p-4 space-y-3" style={{ borderColor: line }}>
            {s.formTeacherRemark && <Said label={`${t.labels.formTeacher}'s Comment`} text={m.reportSheet?.formTeacherRemark} />}
            {s.principalRemark && <Said label={`${t.labels.principal}'s Comment`} text={m.reportSheet?.principalRemark} />}
            {(s.nextTerm || s.signatures) && (
              <div className="grid grid-cols-2 items-end pt-2 text-xs">
                <div>
                  {s.nextTerm && (
                    <>
                      <span className="font-bold text-gray-700 block">{t.labels.nextTerm}:</span>
                      <span className="text-sm font-bold" style={{ color: accent }}>
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

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2 border-b border-dotted border-gray-300 pb-0.5">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="font-bold text-gray-900 truncate">{value}</span>
    </div>
  )
}

function Bubble({ label, value, soft, accent }: { label: string; value: ReactNode; soft: string; accent: string }) {
  return (
    <div className="min-w-[110px] rounded-2xl px-4 py-2 text-center" style={{ background: soft }}>
      <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="block text-lg font-black" style={{ color: accent }}>
        {value}
      </span>
    </div>
  )
}

function StarList({ title, rows, accent, line }: { title: string; rows: Array<[string, number]>; accent: string; line: string }) {
  return (
    <div className="rounded-2xl border-2 p-3" style={{ borderColor: line }}>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
        {title}
      </div>
      {rows.map(([name, rating]) => (
        <div key={name} className="flex items-center justify-between text-sm">
          <span className="text-gray-800">{name}</span>
          <Stars rating={rating} color={accent} />
        </div>
      ))}
    </div>
  )
}

function Said({ label, text }: { label: string; text?: string | null }) {
  return (
    <div>
      <span className="text-xs font-bold text-gray-700 block">{label}:</span>
      <p className="italic text-gray-900 border-b border-dotted border-gray-400 pb-1 min-h-[1.5rem]">{text || ' '}</p>
    </div>
  )
}

import type { ReactNode } from 'react'
import type { ReportModel } from '../model'
import { gradeTone } from '../model'
import type { ReportTemplate } from '../template'
import { textOn, tint } from '../template'
import { FooterNote, GradeKey, RatingKey, SchoolLogo, Signature, StudentPhoto, Watermark } from '../parts'

/** Dense layout: slim header and tight rows, so long subject lists still fit one page. */
export function CompactLayout({ m, t }: { m: ReportModel; t: ReportTemplate }) {
  const s = t.sections
  const accent = t.accentColor
  const onAccent = textOn(accent)
  const ratings = [
    ...(s.affective ? m.affective : []),
    ...(s.psychomotor ? m.psychomotor : []),
  ]

  return (
    <div className="relative text-[11px] leading-tight">
      <Watermark m={m} t={t} />
      <div className="relative space-y-2">
        {/* Slim header */}
        <div className="flex items-center gap-3 border-b-2 pb-2" style={{ borderColor: accent }}>
          {s.logo && <SchoolLogo m={m} size={48} />}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black uppercase tracking-wide text-gray-900 leading-none">{m.school?.schoolName || 'School Name'}</h1>
            {t.motto && <p className="text-[10px] italic text-gray-700">“{t.motto}”</p>}
            <p className="text-[10px] text-gray-600">
              {m.address}
              {m.contact && ` · ${m.contact}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm" style={{ background: accent, color: onAccent }}>
              {t.labels.title}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold text-gray-700">
              {m.term.name} · {m.term.sessionName}
            </div>
          </div>
          {s.studentPhoto && <StudentPhoto m={m} size={44} />}
        </div>

        {/* One-line student details */}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 border border-gray-400 px-2 py-1">
          <Pair label="Name" value={m.student.fullname} />
          <Pair label="Reg No" value={m.student.regNumber || 'N/A'} />
          <Pair label="Class" value={m.student.className} />
          <Pair label="Gender" value={m.student.gender || 'N/A'} />
          {s.attendance && (
            <>
              <Pair label="Opened" value={m.reportSheet?.timesSchoolOpened ?? '-'} />
              <Pair label="Present" value={m.reportSheet?.timesPresent ?? '-'} />
              <Pair label="Absent" value={m.reportSheet?.timesAbsent ?? '-'} />
            </>
          )}
        </div>

        {/* Subjects */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-500 text-[10.5px]">
            <thead>
              <tr className="text-center font-bold" style={{ background: tint(accent, 0.12) }}>
                <th className="border border-gray-500 px-1 py-0.5 text-left">Subject</th>
                {m.caColumns.map((c) => (
                  <th key={c.slot} className="border border-gray-500 px-0.5 py-0.5">
                    {c.name}
                    {c.maxScore > 0 ? ` (${c.maxScore})` : ''}
                  </th>
                ))}
                <th className="border border-gray-500 px-0.5 py-0.5">CA ({m.caMax})</th>
                <th className="border border-gray-500 px-0.5 py-0.5">
                  {m.examName} ({m.examMax})
                </th>
                <th className="border border-gray-500 px-0.5 py-0.5">Total</th>
                <th className="border border-gray-500 px-0.5 py-0.5">Grd</th>
                {m.showSubjectPosition && <th className="border border-gray-500 px-0.5 py-0.5">Pos</th>}
                {s.classAverage && <th className="border border-gray-500 px-0.5 py-0.5">Avg</th>}
                {s.highestLowest && (
                  <>
                    <th className="border border-gray-500 px-0.5 py-0.5">Hi</th>
                    <th className="border border-gray-500 px-0.5 py-0.5">Lo</th>
                  </>
                )}
                {s.subjectRemarks && <th className="border border-gray-500 px-1 py-0.5 text-left">{t.labels.subjectRemark}</th>}
              </tr>
            </thead>
            <tbody>
              {m.subjects.map((sub, idx) => (
                <tr key={sub.id || idx} className="text-center">
                  <td className="border border-gray-400 px-1 py-[1px] text-left font-medium text-gray-900 whitespace-nowrap">{sub.subjectName}</td>
                  {m.caColumns.map((c) => (
                    <td key={c.slot} className="border border-gray-400 px-0.5 py-[1px]">
                      {m.show(m.score(sub, c.slot))}
                    </td>
                  ))}
                  <td className="border border-gray-400 px-0.5 py-[1px]">{m.show(sub.caTotal)}</td>
                  <td className="border border-gray-400 px-0.5 py-[1px]">{m.show(sub.examTotal)}</td>
                  <td className="border border-gray-400 px-0.5 py-[1px] font-bold">{m.show(sub.totalScore)}</td>
                  <td className={`border border-gray-400 px-0.5 py-[1px] font-bold ${gradeTone(sub.grade)}`}>{sub.grade}</td>
                  {m.showSubjectPosition && (
                    <td className="border border-gray-400 px-0.5 py-[1px]">{sub.subjectPositionFormatted || m.blank}</td>
                  )}
                  {s.classAverage && (
                    <td className="border border-gray-400 px-0.5 py-[1px] text-gray-600">
                      {sub.classAverage > 0 ? Number(sub.classAverage).toFixed(1) : '-'}
                    </td>
                  )}
                  {s.highestLowest && (
                    <>
                      <td className="border border-gray-400 px-0.5 py-[1px] text-gray-600">{m.show(sub.classHighest)}</td>
                      <td className="border border-gray-400 px-0.5 py-[1px] text-gray-600">{m.show(sub.classLowest)}</td>
                    </>
                  )}
                  {s.subjectRemarks && (
                    <td className="border border-gray-400 px-1 py-[1px] text-left italic text-gray-700 truncate max-w-[110px]">
                      {sub.teacherRemark || '-'}
                    </td>
                  )}
                </tr>
              ))}
              {m.subjects.length === 0 && (
                <tr>
                  <td colSpan={14} className="text-center p-2 text-gray-500">
                    No subject records entered yet for this term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary in one row */}
        {s.summary && (
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 border border-gray-400 px-2 py-1 font-semibold">
            <Pair label="Obtainable" value={m.reportSheet?.totalScoreObtainable ?? '-'} />
            <Pair label="Obtained" value={m.reportSheet?.totalScoreObtained ?? '-'} />
            <Pair label="Average" value={m.reportSheet?.overallPercentage ? `${m.reportSheet.overallPercentage}%` : '-'} />
            {m.showClassPosition && <Pair label="Position" value={m.reportSheet?.classPositionFormatted || m.blank} />}
            <Pair label="In Class" value={m.reportSheet?.totalStudentsInClass ?? '-'} />
            <Pair label="Grade" value={m.reportSheet?.overallGrade ?? '-'} />
          </div>
        )}

        {s.gradeKey && <GradeKey m={m} className="text-center" />}

        {/* Ratings in a dense grid */}
        {ratings.length > 0 && (
          <div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-3 border border-gray-400 px-2 py-1">
              {ratings.map(([name, rating]) => (
                <div key={name} className="flex justify-between gap-1 border-b border-dotted border-gray-300">
                  <span className="text-gray-700 truncate">{name}</span>
                  <span className="font-bold">{rating}</span>
                </div>
              ))}
            </div>
            {s.ratingKey && <RatingKey className="mt-0.5 text-center" />}
          </div>
        )}

        {/* Remarks side by side */}
        {(s.formTeacherRemark || s.principalRemark) && (
          <div className="grid grid-cols-2 gap-2">
            {s.formTeacherRemark && (
              <div className="border border-gray-400 px-2 py-1">
                <span className="font-bold text-gray-700">{t.labels.formTeacher}: </span>
                <span className="italic">{m.reportSheet?.formTeacherRemark || ' '}</span>
              </div>
            )}
            {s.principalRemark && (
              <div className="border border-gray-400 px-2 py-1">
                <span className="font-bold text-gray-700">{t.labels.principal}: </span>
                <span className="italic">{m.reportSheet?.principalRemark || ' '}</span>
              </div>
            )}
          </div>
        )}
        {(s.nextTerm || s.signatures) && (
          <div className="grid grid-cols-2 items-end">
            <div>
              {s.nextTerm && (
                <>
                  <span className="font-bold text-gray-700">{t.labels.nextTerm}: </span>
                  <span className="font-semibold">{m.nextTerm}</span>
                </>
              )}
            </div>
            {s.signatures && <Signature m={m} t={t} />}
          </div>
        )}

        <FooterNote t={t} />
      </div>
    </div>
  )
}

function Pair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-gray-500">{label}:</span> <strong className="text-gray-900">{value}</strong>
    </span>
  )
}

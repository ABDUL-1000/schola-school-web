import type { ReactNode } from 'react'
import type { ReportModel } from '../model'
import { gradeTone } from '../model'
import type { ReportTemplate } from '../template'
import { textOn } from '../template'
import { FooterNote, GradeKey, RatingKey, SchoolLogo, Signature, StudentPhoto, Watermark } from '../parts'

/** The standard Nigerian report sheet (the original design). */
export function ClassicLayout({ m, t }: { m: ReportModel; t: ReportTemplate }) {
  const s = t.sections
  const accent = t.accentColor

  return (
    <div className="relative">
      <Watermark m={m} t={t} />
      <div className="relative">
        {/* Header with School Details */}
        <div className="border-b-2 pb-4 mb-4 text-center relative" style={{ borderColor: accent }}>
          <div className="flex items-center justify-center gap-4 mb-2">
            {s.logo && <SchoolLogo m={m} />}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-gray-900">
                {m.school?.schoolName || 'School Name'}
              </h1>
              {t.motto && <p className="text-xs italic text-gray-700">“{t.motto}”</p>}
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">{m.address || 'School Address'}</p>
              {m.contact && <p className="text-xs text-gray-500 mt-0.5">{m.contact}</p>}
            </div>
            {s.studentPhoto && <StudentPhoto m={m} />}
          </div>
          <div
            className="inline-block px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-sm mt-1"
            style={{ background: accent, color: textOn(accent) }}
          >
            {t.labels.title}
          </div>
        </div>

        {/* Student Information & Attendance Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-black p-3 rounded-sm mb-4 bg-gray-50/50">
          <Info label="Student Fullname" value={m.student.fullname} strong />
          <Info label="Admission / Reg No" value={m.student.regNumber || 'N/A'} strong />
          <Info label="Class / Arm" value={m.student.className} strong />
          <Info label="Gender" value={m.student.gender || 'N/A'} strong />
          <Info label="Academic Session" value={m.term.sessionName || 'N/A'} top />
          <Info label="Term" value={m.term.name} top />
          {s.attendance ? (
            <>
              <Info label="Times School Opened" value={m.reportSheet?.timesSchoolOpened ?? '-'} top strong />
              <Info
                label="Times Present / Absent"
                value={`${m.reportSheet?.timesPresent ?? '-'} / ${m.reportSheet?.timesAbsent ?? '-'}`}
                top
                strong
              />
            </>
          ) : (
            <Info label="Total Students" value={m.reportSheet?.totalStudentsInClass ?? '-'} top strong />
          )}
        </div>

        {/* Academic Performance Table (Cognitive Domain) */}
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-200 text-gray-900 font-bold border-b border-black text-center">
                <th className="p-1.5 border-r border-black text-left w-36">Subject</th>
                {m.caColumns.map((c) => (
                  <th key={c.slot} className="p-1 border-r border-black w-10">
                    {c.name}
                    {c.maxScore > 0 ? ` (${c.maxScore})` : ''}
                  </th>
                ))}
                <th className="p-1 border-r border-black w-12 bg-gray-300">CA Total ({m.caMax})</th>
                <th className="p-1 border-r border-black w-12">
                  {m.examName} ({m.examMax})
                </th>
                <th className="p-1 border-r border-black w-12 bg-gray-300 font-black">Total (100)</th>
                <th className="p-1 border-r border-black w-10 font-bold">Grade</th>
                {m.showSubjectPosition && <th className="p-1 border-r border-black w-12">Position</th>}
                {s.classAverage && <th className="p-1 border-r border-black w-12">Class Avg</th>}
                {s.highestLowest && (
                  <>
                    <th className="p-1 border-r border-black w-10">High</th>
                    <th className="p-1 border-r border-black w-10">Low</th>
                  </>
                )}
                {s.subjectRemarks && <th className="p-1 border-black text-left">{t.labels.subjectRemark}</th>}
              </tr>
            </thead>
            <tbody>
              {m.subjects.map((sub, idx) => (
                <tr
                  key={sub.id || idx}
                  className={`border-b border-gray-300 text-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="p-1.5 border-r border-black text-left font-medium text-gray-900">{sub.subjectName}</td>
                  {m.caColumns.map((c) => (
                    <td key={c.slot} className="p-1 border-r border-black">
                      {m.show(m.score(sub, c.slot))}
                    </td>
                  ))}
                  <td className="p-1 border-r border-black font-semibold bg-gray-100">{m.show(sub.caTotal)}</td>
                  <td className="p-1 border-r border-black">{m.show(sub.examTotal)}</td>
                  <td className="p-1 border-r border-black font-black text-sm bg-gray-100">{m.show(sub.totalScore)}</td>
                  <td className="p-1 border-r border-black font-bold">
                    <span className={`px-1 rounded font-black ${gradeTone(sub.grade)}`}>{sub.grade}</span>
                  </td>
                  {m.showSubjectPosition && (
                    <td className="p-1 border-r border-black font-medium text-gray-700">
                      {sub.subjectPositionFormatted || m.blank}
                    </td>
                  )}
                  {s.classAverage && (
                    <td className="p-1 border-r border-black text-gray-600">
                      {sub.classAverage > 0 ? Number(sub.classAverage).toFixed(1) : '-'}
                    </td>
                  )}
                  {s.highestLowest && (
                    <>
                      <td className="p-1 border-r border-black text-gray-600">{m.show(sub.classHighest)}</td>
                      <td className="p-1 border-r border-black text-gray-600">{m.show(sub.classLowest)}</td>
                    </>
                  )}
                  {s.subjectRemarks && (
                    <td className="p-1 border-black text-left text-gray-700 italic truncate max-w-[120px]">
                      {sub.teacherRemark || '-'}
                    </td>
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

        {/* Overall Academic Summary Bar */}
        {s.summary && (
          <div
            className={`grid grid-cols-2 ${m.showClassPosition ? 'sm:grid-cols-6' : 'sm:grid-cols-5'} gap-2 text-xs border border-black p-2.5 rounded-sm mb-4 bg-gray-100 text-center font-bold`}
          >
            <Stat label="Marks Obtainable" value={m.reportSheet?.totalScoreObtainable ?? '-'} />
            <Stat label="Marks Obtained" value={m.reportSheet?.totalScoreObtained ?? '-'} />
            <Stat
              label="Overall Average"
              value={m.reportSheet?.overallPercentage ? `${m.reportSheet.overallPercentage}%` : '-'}
              className="text-blue-800"
            />
            {m.showClassPosition && (
              <Stat
                label="Class Position"
                value={m.reportSheet?.classPositionFormatted || m.blank}
                className="text-base text-purple-900 font-black"
              />
            )}
            <Stat label="Total Students" value={m.reportSheet?.totalStudentsInClass ?? '-'} />
            <Stat label="Overall Grade" value={m.reportSheet?.overallGrade ?? '-'} className="font-black text-green-700" />
          </div>
        )}

        {s.gradeKey && <GradeKey m={m} className="mb-4 border border-gray-300 p-1.5 rounded text-center" />}

        {/* Affective & Psychomotor Evaluation Domains (only once rated) */}
        {m.hasDomains && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {s.affective && m.affective.length > 0 && (
                <DomainTable title={t.labels.affective} heading="Behavioural Trait" rows={m.affective} />
              )}
              {s.psychomotor && m.psychomotor.length > 0 && (
                <DomainTable title={t.labels.psychomotor} heading="Skill / Capability" rows={m.psychomotor} />
              )}
            </div>
            {s.ratingKey && <RatingKey className="mb-4 border border-dashed border-gray-300 p-1.5 rounded text-center" />}
          </>
        )}

        {/* Remarks and Signatures Block */}
        {(s.formTeacherRemark || s.principalRemark || s.nextTerm || s.signatures) && (
          <div className="border border-black p-3 rounded-sm text-xs space-y-3 bg-gray-50/30">
            {s.formTeacherRemark && (
              <div>
                <span className="font-bold text-gray-700 block">{t.labels.formTeacher}'s Remark:</span>
                <p className="italic text-gray-900 mt-0.5 border-b border-dotted border-gray-400 pb-1">
                  {m.reportSheet?.formTeacherRemark || ' '}
                </p>
              </div>
            )}
            {s.principalRemark && (
              <div>
                <span className="font-bold text-gray-700 block">{t.labels.principal}'s Remark:</span>
                <p className="italic text-gray-900 mt-0.5 border-b border-dotted border-gray-400 pb-1">
                  {m.reportSheet?.principalRemark || ' '}
                </p>
              </div>
            )}
            {(s.nextTerm || s.signatures) && (
              <div className="grid grid-cols-2 pt-2 border-t border-gray-300">
                <div>
                  {s.nextTerm && (
                    <>
                      <span className="font-bold text-gray-700 block">{t.labels.nextTerm}:</span>
                      <span className="font-semibold text-gray-900">{m.nextTerm}</span>
                    </>
                  )}
                </div>
                {s.signatures && <Signature m={m} t={t} />}
              </div>
            )}
          </div>
        )}

        <FooterNote t={t} className="mt-3" />
      </div>
    </div>
  )
}

function Info({ label, value, strong, top }: { label: string; value: ReactNode; strong?: boolean; top?: boolean }) {
  return (
    <div className={top ? 'pt-2 border-t border-gray-200' : ''}>
      <span className="font-semibold text-gray-600 block">{label}:</span>
      <span className={strong ? 'font-bold text-sm text-gray-900' : 'font-medium text-gray-900'}>{value}</span>
    </div>
  )
}

function Stat({ label, value, className = 'text-gray-900' }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div>
      <span className="text-gray-600 text-[10px] block uppercase">{label}</span>
      <span className={`text-sm ${className}`}>{value}</span>
    </div>
  )
}

function DomainTable({ title, heading, rows }: { title: string; heading: string; rows: Array<[string, number]> }) {
  return (
    <div className="border border-black rounded-sm overflow-hidden text-xs">
      <div className="bg-gray-200 p-1.5 font-bold border-b border-black text-center uppercase tracking-wide">{title}</div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-50 text-[10px] text-gray-600">
            <th className="p-1 pl-2 text-left">{heading}</th>
            <th className="p-1 text-center w-12">Rating (1-5)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, rating], i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="p-1 pl-2 text-gray-800 font-medium">{name}</td>
              <td className="p-1 text-center font-bold text-gray-900">{rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

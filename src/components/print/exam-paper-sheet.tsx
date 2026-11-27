import type { PrintableExam } from './exam-print.types'
import { schoolAddress, schoolContacts, typeLabel } from './exam-print.types'

/**
 * The exam/test exactly as it should look on paper (A4), with the school
 * letterhead, session and term. Used on screen and for browser printing.
 */
export function ExamPaperSheet({ data }: { data: PrintableExam }) {
  const { school, paper } = data
  let n = 0

  return (
    <article className="exam-sheet mx-auto w-full min-w-[330px] max-w-[210mm] bg-white p-4 text-[11.5px] leading-relaxed text-black shadow-sm ring-1 ring-black/10 sm:p-[14mm] sm:text-[13px] print:min-w-0 print:max-w-none print:p-0 print:text-[13px] print:shadow-none print:ring-0">
      {/* Letterhead */}
      <header className="flex items-center gap-2 border-b-2 border-black pb-3 sm:gap-4 print:gap-4">
        {school?.logo ? (
          <img src={school.logo} alt="" className="size-12 shrink-0 object-contain sm:size-20 print:size-20" crossOrigin="anonymous" />
        ) : (
          <div className="size-12 shrink-0 sm:size-20 print:size-20" />
        )}
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-sm font-extrabold uppercase leading-tight tracking-wide sm:text-xl print:text-xl">{school?.schoolName}</h1>
          {schoolAddress(school) && <p className="text-[10px] sm:text-xs print:text-xs">{schoolAddress(school)}</p>}
          {schoolContacts(school) && <p className="text-[10px] sm:text-xs print:text-xs">{schoolContacts(school)}</p>}
          {paper.branch?.name && <p className="text-[10px] italic sm:text-xs print:text-xs">{paper.branch.name}</p>}
        </div>
        <div className="size-12 shrink-0 sm:size-20 print:size-20" />
      </header>

      <div className="mt-3 text-center">
        {paper.term && (
          <p className="text-xs font-bold uppercase sm:text-sm print:text-sm">
            {paper.term.sessionName} Academic Session — {paper.term.name}
          </p>
        )}
        <p className="mt-1 text-sm font-bold uppercase underline underline-offset-4 sm:text-base print:text-base">
          {typeLabel(paper.type)}: {paper.title}
        </p>
      </div>

      <div className="mt-3 overflow-x-auto print:overflow-visible">
      <table className="w-full min-w-[440px] border-collapse text-[11px] sm:text-xs print:min-w-0 print:text-xs">
        <tbody>
          <tr>
            <td className="border border-black px-2 py-1"><b>Subject:</b> {paper.subjectName}</td>
            <td className="border border-black px-2 py-1"><b>Class:</b> {paper.className}</td>
            <td className="border border-black px-2 py-1"><b>Time:</b> {paper.durationMinutes ? `${paper.durationMinutes} mins` : '—'}</td>
            <td className="border border-black px-2 py-1"><b>Marks:</b> {paper.totalMarks ?? '—'}</td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-2" colSpan={3}><b>Name:</b> ____________________________________________</td>
            <td className="border border-black px-2 py-2"><b>Reg. No:</b> ____________</td>
          </tr>
        </tbody>
      </table>
      </div>

      {paper.showAnswers && (
        <p className="mt-3 rounded border border-black px-2 py-1 text-center text-xs font-bold uppercase">
          Marking guide — not for students
        </p>
      )}

      {paper.instructions && (
        <p className="mt-3 text-xs">
          <b>INSTRUCTIONS:</b> <span className="whitespace-pre-wrap">{paper.instructions}</span>
        </p>
      )}

      {paper.attachment && (
        <p className="mt-3 text-xs italic print:hidden">
          This paper includes an attached file:{' '}
          <a href={paper.attachment.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
            {paper.attachment.name || 'open attachment'}
          </a>
        </p>
      )}

      <div className="mt-4 space-y-5">
        {paper.sections.map((section, si) => (
          <section key={si} className="break-inside-avoid-page">
            <h2 className="text-xs font-bold uppercase sm:text-sm print:text-sm">{section.title}</h2>
            {section.instructions && <p className="text-xs italic">{section.instructions}</p>}
            <ol className="mt-2 space-y-3">
              {section.questions.map((q, qi) => {
                n += 1
                return (
                  <li key={qi} className="flex gap-2 break-inside-avoid">
                    <span className="w-5 shrink-0 font-semibold sm:w-6 print:w-6">{n}.</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <p className="min-w-0 whitespace-pre-wrap break-words">{q.text}</p>
                        {q.marks ? <span className="shrink-0 text-xs">[{q.marks}]</span> : null}
                      </div>
                      {q.options.length > 0 && (
                        <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-0.5 min-[420px]:grid-cols-2 print:grid-cols-2">
                          {q.options.map((o, oi) => (
                            <span key={oi} className={paper.showAnswers && q.answer === o ? 'font-bold underline' : ''}>
                              ({String.fromCharCode(97 + oi)}) {o}
                            </span>
                          ))}
                        </div>
                      )}
                      {paper.showAnswers && q.answer && q.options.length === 0 && (
                        <p className="mt-1 text-xs italic"><b>Answer:</b> {q.answer}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>

      <footer className="mt-8 border-t border-black pt-2 text-center text-[10px]">
        {paper.subjectName} · {paper.className} · Set by {paper.teacherName} · {school?.schoolName}
      </footer>
    </article>
  )
}

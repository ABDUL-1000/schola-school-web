import React from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Download, Award, Calendar, CheckCircle2, User, BookOpen } from 'lucide-react'

interface NigerianReportSheetProps {
  data: any
  onClose?: () => void
}

export const NigerianReportSheet: React.FC<NigerianReportSheetProps> = ({ data, onClose }) => {
  if (!data || !data.student) return null

  const { school, student, term, config, reportSheet, subjects = [] } = data

  const handlePrint = () => {
    window.print()
  }

  const affectiveDomain = (reportSheet?.affectiveDomain as Record<string, number>) || {}
  const psychomotorDomain = (reportSheet?.psychomotorDomain as Record<string, number>) || {}

  return (
    <div className="space-y-4">
      {/* Action Bar (Hidden during Print) */}
      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border border-border print:hidden">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Nigerian Standard Report Sheet</span>
          {reportSheet?.status && (
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                reportSheet.status === 'PUBLISHED'
                  ? 'bg-success/15 text-success'
                  : 'bg-warning/15 text-warning'
              }`}
            >
              {reportSheet.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Printable Report Sheet Document */}
      <div className="bg-white text-black p-6 sm:p-8 rounded-xl border border-gray-300 shadow-sm print:border-none print:shadow-none print:p-0 w-full max-w-6xl mx-auto font-sans">
        {/* Header with School Details */}
        <div className="border-b-2 border-black pb-4 mb-4 text-center relative">
          <div className="flex items-center justify-center gap-4 mb-2">
            {school?.logo ? (
              <img
                src={school.logo}
                alt="School Logo"
                className="w-20 h-20 object-contain rounded"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-400 flex items-center justify-center font-bold text-xl text-gray-700">
                {school?.schoolName?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-gray-900">
                {school?.schoolName || 'School Name'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                {school?.address || 'School Address'}
                {school?.city && `, ${school.city}`}
                {school?.state && `, ${school.state}`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {school?.phone && `Tel: ${school.phone}`} {school?.email && `| Email: ${school.email}`}
              </p>
            </div>
          </div>
          <div className="inline-block bg-black text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-sm mt-1">
            Student Continuous Assessment & Examination Report Sheet
          </div>
        </div>

        {/* Student Information & Attendance Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-black p-3 rounded-sm mb-4 bg-gray-50/50">
          <div>
            <span className="font-semibold text-gray-600 block">Student Fullname:</span>
            <span className="font-bold text-sm text-gray-900">{student.fullname}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600 block">Admission / Reg No:</span>
            <span className="font-bold text-sm text-gray-900">{student.regNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600 block">Class / Arm:</span>
            <span className="font-bold text-sm text-gray-900">{student.className}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600 block">Gender:</span>
            <span className="font-bold text-sm text-gray-900">{student.gender || 'N/A'}</span>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-600 block">Academic Session:</span>
            <span className="font-medium text-gray-900">{term.sessionName || 'N/A'}</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-600 block">Term:</span>
            <span className="font-medium text-gray-900">{term.name}</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-600 block">Times School Opened:</span>
            <span className="font-bold text-gray-900">{reportSheet?.timesSchoolOpened ?? 65}</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-600 block">Times Present / Absent:</span>
            <span className="font-bold text-gray-900">
              {reportSheet?.timesPresent ?? 63} / {reportSheet?.timesAbsent ?? 2}
            </span>
          </div>
        </div>

        {/* Academic Performance Table (Cognitive Domain) */}
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-200 text-gray-900 font-bold border-b border-black text-center">
                <th className="p-1.5 border-r border-black text-left w-36">Subject</th>
                <th className="p-1 border-r border-black w-10">CA 1 ({config?.ca1MaxScore ?? 10})</th>
                <th className="p-1 border-r border-black w-10">CA 2 ({config?.ca2MaxScore ?? 10})</th>
                <th className="p-1 border-r border-black w-10">CA 3 ({config?.ca3MaxScore ?? 10})</th>
                <th className="p-1 border-r border-black w-10">Assg ({config?.assignmentMaxScore ?? 10})</th>
                <th className="p-1 border-r border-black w-12 bg-gray-300">CA Total (40)</th>
                <th className="p-1 border-r border-black w-12">Exam ({config?.examMaxScore ?? 60})</th>
                <th className="p-1 border-r border-black w-12 bg-gray-300 font-black">Total (100)</th>
                <th className="p-1 border-r border-black w-10 font-bold">Grade</th>
                <th className="p-1 border-r border-black w-12">Position</th>
                <th className="p-1 border-r border-black w-12">Class Avg</th>
                <th className="p-1 border-black text-left">Teacher Remark</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub: any, idx: number) => (
                <tr
                  key={sub.id || idx}
                  className={`border-b border-gray-300 text-center ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="p-1.5 border-r border-black text-left font-medium text-gray-900">
                    {sub.subjectName}
                  </td>
                  <td className="p-1 border-r border-black">{sub.ca1Score > 0 ? sub.ca1Score : '-'}</td>
                  <td className="p-1 border-r border-black">{sub.ca2Score > 0 ? sub.ca2Score : '-'}</td>
                  <td className="p-1 border-r border-black">{sub.ca3Score > 0 ? sub.ca3Score : '-'}</td>
                  <td className="p-1 border-r border-black">
                    {sub.assignmentScore > 0 ? sub.assignmentScore : '-'}
                  </td>
                  <td className="p-1 border-r border-black font-semibold bg-gray-100">
                    {sub.caTotal > 0 ? sub.caTotal : '-'}
                  </td>
                  <td className="p-1 border-r border-black">{sub.examTotal > 0 ? sub.examTotal : '-'}</td>
                  <td className="p-1 border-r border-black font-black text-sm bg-gray-100">
                    {sub.totalScore > 0 ? sub.totalScore : '-'}
                  </td>
                  <td className="p-1 border-r border-black font-bold">
                    <span
                      className={`px-1 rounded ${
                        sub.grade?.startsWith('A')
                          ? 'text-green-700 font-black'
                          : sub.grade?.startsWith('F')
                          ? 'text-red-600 font-black'
                          : 'text-gray-900'
                      }`}
                    >
                      {sub.grade}
                    </span>
                  </td>
                  <td className="p-1 border-r border-black font-medium text-gray-700">
                    {sub.subjectPositionFormatted || '-'}
                  </td>
                  <td className="p-1 border-r border-black text-gray-600">
                    {sub.classAverage > 0 ? sub.classAverage.toFixed(1) : '-'}
                  </td>
                  <td className="p-1 border-black text-left text-gray-700 italic truncate max-w-[120px]">
                    {sub.teacherRemark || '-'}
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center p-4 text-gray-500">
                    No subject records entered yet for this term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Overall Academic Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs border border-black p-2.5 rounded-sm mb-4 bg-gray-100 text-center font-bold">
          <div>
            <span className="text-gray-600 text-[10px] block uppercase">Marks Obtainable</span>
            <span className="text-sm text-gray-900">{reportSheet?.totalScoreObtainable ?? '-'}</span>
          </div>
          <div>
            <span className="text-gray-600 text-[10px] block uppercase">Marks Obtained</span>
            <span className="text-sm text-gray-900">{reportSheet?.totalScoreObtained ?? '-'}</span>
          </div>
          <div>
            <span className="text-gray-600 text-[10px] block uppercase">Overall Average</span>
            <span className="text-sm text-blue-800">
              {reportSheet?.overallPercentage ? `${reportSheet.overallPercentage}%` : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 text-[10px] block uppercase">Class Position</span>
            <span className="text-base text-purple-900 font-black">
              {reportSheet?.classPositionFormatted ?? '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 text-[10px] block uppercase">Total Students</span>
            <span className="text-sm text-gray-900">{reportSheet?.totalStudentsInClass ?? '-'}</span>
          </div>
          <div>
            <span className="text-gray-600 text-[10px] block uppercase">Overall Grade</span>
            <span className="text-sm font-black text-green-700">{reportSheet?.overallGrade ?? '-'}</span>
          </div>
        </div>

        {/* Affective & Psychomotor Evaluation Domains */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Affective Domain */}
          <div className="border border-black rounded-sm overflow-hidden text-xs">
            <div className="bg-gray-200 p-1.5 font-bold border-b border-black text-center uppercase tracking-wide">
              Affective Domain (Character & Behaviour)
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50 text-[10px] text-gray-600">
                  <th className="p-1 pl-2 text-left">Behavioral Trait</th>
                  <th className="p-1 text-center w-12">Rating (1-5)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(affectiveDomain).map(([trait, rating], i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-1 pl-2 text-gray-800 font-medium">{trait}</td>
                    <td className="p-1 text-center font-bold text-gray-900">{rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Psychomotor Domain */}
          <div className="border border-black rounded-sm overflow-hidden text-xs">
            <div className="bg-gray-200 p-1.5 font-bold border-b border-black text-center uppercase tracking-wide">
              Psychomotor Domain (Skills & Physical)
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50 text-[10px] text-gray-600">
                  <th className="p-1 pl-2 text-left">Skill / Capability</th>
                  <th className="p-1 text-center w-12">Rating (1-5)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(psychomotorDomain).map(([skill, rating], i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-1 pl-2 text-gray-800 font-medium">{skill}</td>
                    <td className="p-1 text-center font-bold text-gray-900">{rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rating Scale Legend */}
        <div className="text-[10px] text-gray-500 mb-4 border border-dashed border-gray-300 p-1.5 rounded text-center">
          <span className="font-semibold text-gray-700 mr-2">Behavioral / Skill Rating Key:</span>
          5 - Excellent | 4 - Good | 3 - Fair / Average | 2 - Poor | 1 - Very Poor
        </div>

        {/* Remarks and Signatures Block */}
        <div className="border border-black p-3 rounded-sm text-xs space-y-3 bg-gray-50/30">
          <div>
            <span className="font-bold text-gray-700 block">Form Teacher's Remark:</span>
            <p className="italic text-gray-900 mt-0.5 border-b border-dotted border-gray-400 pb-1">
              {reportSheet?.formTeacherRemark || 'Satisfactory academic performance and good conduct.'}
            </p>
          </div>

          <div>
            <span className="font-bold text-gray-700 block">Principal / Headmaster's Remark:</span>
            <p className="italic text-gray-900 mt-0.5 border-b border-dotted border-gray-400 pb-1">
              {reportSheet?.principalRemark || 'Promising result. Continue striving for excellence.'}
            </p>
          </div>

          <div className="grid grid-cols-2 pt-2 border-t border-gray-300">
            <div>
              <span className="font-bold text-gray-700 block">Next Term Begins:</span>
              <span className="font-semibold text-gray-900">
                {reportSheet?.nextTermBegins
                  ? new Date(reportSheet.nextTermBegins).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'To be announced'}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-gray-700 block">Principal's Signature & Stamp:</span>
              <div className="h-10 mt-1 flex items-end justify-end">
                {config?.principalSignatureUrl ? (
                  <img
                    src={config.principalSignatureUrl}
                    alt="Signature"
                    className="max-h-10 object-contain"
                  />
                ) : (
                  <span className="font-serif italic text-sm text-gray-800 border-b border-black px-4">
                    Authorized Signature
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

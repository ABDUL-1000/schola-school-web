import type { Exam, ExamSection, ExamQuestion } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle2, FileIcon, HelpCircle, AlignLeft, ListTodo, FileText, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamPreviewProps {
  exam: Exam
}

export function ExamPreview({ exam }: ExamPreviewProps) {
  if (!exam.sections || exam.sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
        <HelpCircle className="size-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">This exam has no sections or questions yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {exam.sections.map((section, idx) => (
        <SectionPreview key={section.id || idx} section={section} index={idx} />
      ))}
    </div>
  )
}

function SectionPreview({ section, index }: { section: ExamSection; index: number }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm bg-background/50 ring-1 ring-border/50">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40" />
      <CardHeader className="pb-3 bg-muted/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded uppercase">
              Section {index + 1}
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-semibold h-5">
              {section.type}
            </Badge>
          </div>
          <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
            {section.answerAll ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-green-500" /> Answer All
              </span>
            ) : (
              <span>Max Questions: {section.maxQuestionsToAnswer}</span>
            )}
          </div>
        </div>
        <h3 className="text-lg font-bold mt-2 tracking-tight">{section.title}</h3>
        {section.instructions && (
          <p className="text-xs text-muted-foreground mt-1 bg-background/50 p-2 rounded border border-dashed italic">
            {section.instructions}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {section.questions.map((question, qIdx) => (
          <QuestionPreview key={question.id || qIdx} question={question} index={qIdx} />
        ))}
      </CardContent>
    </Card>
  )
}

function QuestionPreview({ question, index }: { question: ExamQuestion; index: number }) {
  const getIcon = () => {
    switch (question.questionType) {
      case 'MULTIPLE_CHOICE': return <ListTodo className="size-4" />
      case 'TRUE_FALSE': return <CheckCircle2 className="size-4" />
      case 'SHORT_ANSWER': return <AlignLeft className="size-4" />
      case 'ESSAY': return <FileText className="size-4" />
      case 'FILE_UPLOAD': return <FileIcon className="size-4" />
      default: return <HelpCircle className="size-4" />
    }
  }

  return (
    <div className="group relative pl-8 border-l-2 border-muted hover:border-primary/30 transition-colors pb-2">
      <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-background border-2 border-muted group-hover:border-primary/50 transition-colors flex items-center justify-center">
        <div className="size-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50" />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground/60">Q{index + 1}</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/50 rounded text-[10px] font-bold text-muted-foreground uppercase">
              {getIcon()}
              {question.questionType.replace('_', ' ')}
            </div>
          </div>
          
          <p className="text-sm font-semibold leading-relaxed text-foreground md:text-base">
            {question.text}
          </p>

          {/* Options */}
          {(question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') && (
            <div className="grid gap-2 mt-4 sm:grid-cols-2">
              {question.options.map((option, oIdx) => (
                <div 
                  key={option.id || oIdx} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-xs transition-all",
                    option.isCorrect 
                      ? "bg-green-50/50 border-green-200 ring-1 ring-green-100" 
                      : "bg-background border-border/50"
                  )}
                >
                  <div className={cn(
                    "size-4 rounded-full border flex items-center justify-center shrink-0",
                    option.isCorrect ? "bg-green-500 border-green-600 shadow-sm" : "border-muted-foreground/30"
                  )}>
                    {option.isCorrect && <Check className="size-3 text-white" strokeWidth={4} />}
                  </div>
                  <span className={cn(
                    "flex-1",
                    option.isCorrect ? "font-bold text-green-900" : "text-muted-foreground"
                  )}>
                    {option.text}
                  </span>
                  {option.isCorrect && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-[8px] h-4 uppercase font-black tracking-tighter">
                      Correct
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Attachments */}
          {question.attachments && question.attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-dashed">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-1 opacity-50">Attachments:</span>
              {question.attachments.map((file, fIdx) => (
                <a 
                  key={file.id || fIdx}
                  href={file.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded text-[10px] font-medium text-primary transition-colors"
                >
                  <FileIcon className="size-3" />
                  <span className="max-w-[120px] truncate">{file.fileName}</span>
                </a>
              ))}
            </div>
          )}
          
          {question.explanation && (
            <div className="mt-4 p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
              <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Explanation</p>
              <p className="text-xs text-blue-900/80 italic">{question.explanation}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end">
          <div className="px-2 py-1 bg-primary/10 text-primary font-black text-[10px] rounded-full border border-primary/20 shadow-xs">
            {question.allocatedScore} PTS
          </div>
        </div>
      </div>
    </div>
  )
}


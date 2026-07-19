import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOnboardingStore } from '@/hooks/stores/onboarding.store'
import { useSetupAcademicMutation } from '@/hooks/queries/onboarding.queries'
import { toast } from '@/lib/toast'
import React, { useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
export const Route = createFileRoute('/_authenticated/onboarding/academic')({
  component: AcademicStep,
})

const DEFAULT_TERMS = [
  { name: 'First Term', startDate: '', endDate: '' },
  { name: 'Second Term', startDate: '', endDate: '' },
  { name: 'Third Term', startDate: '', endDate: '' },
]

const CLASS_TEMPLATES = {
  NURSERY: ['Creche', 'Pre-Nursery', 'Nursery 1', 'Nursery 2'],
  PRIMARY: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
  SECONDARY: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'],
  COMBINED: [
    'Creche', 'Pre-Nursery', 'Nursery 1', 'Nursery 2',
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'
  ],
}

function AcademicStep() {
  const navigate = useNavigate()
  const { formData, updateFormData, setStep } = useOnboardingStore()
  const { mutateAsync: setupAcademic, isPending } = useSetupAcademicMutation()

  useEffect(() => {
    setStep(3)
    if (!formData.sessionName) {
      const year = new Date().getFullYear()
      updateFormData({
        sessionName: `${year}/${year + 1}`,
        terms: DEFAULT_TERMS,
      })
    }
    
    if (formData.classes.length === 0 && formData.schoolCategory && formData.schoolCategory.length > 0) {
      let combinedTemplates: string[] = []
      formData.schoolCategory.forEach(category => {
        const template = CLASS_TEMPLATES[category as keyof typeof CLASS_TEMPLATES]
        if (template) {
          combinedTemplates = [...combinedTemplates, ...template]
        }
      })
      
      const defaultClasses = combinedTemplates.map((name, index) => ({
        name,
        level: name,
        sortOrder: index + 1,
      }))
      updateFormData({ classes: defaultClasses })
    }
  }, [setStep, formData.sessionName, formData.classes.length, formData.schoolCategory, updateFormData])

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.sessionName || !formData.sessionStartDate || !formData.sessionEndDate) {
      toast.error('Please complete session details')
      return
    }

    if (formData.classes.length === 0) {
      toast.error('Please select at least one class')
      return
    }

    try {
      const promise = setupAcademic({
        sessionName: formData.sessionName,
        sessionStartDate: new Date(formData.sessionStartDate).toISOString(),
        sessionEndDate: new Date(formData.sessionEndDate).toISOString(),
        terms: formData.terms.map(t => ({
          name: t.name,
          startDate: t.startDate ? new Date(t.startDate).toISOString() : new Date().toISOString(),
          endDate: t.endDate ? new Date(t.endDate).toISOString() : new Date().toISOString(),
        })),
        classes: formData.classes,
      })

      toast.promise(promise, {
        loading: 'Setting up academic foundation...',
        success: 'Welcome to your Dashboard!',
        error: 'Failed to complete setup',
      })

      await promise
      // Final Redirect
      window.location.href = '/dashboard'
    } catch (error) {
      console.error(error)
    }
  }

  const toggleClass = (className: string) => {
    const exists = formData.classes.find((c) => c.name === className)
    if (exists) {
      updateFormData({ classes: formData.classes.filter(c => c.name !== className) })
    } else {
      const newClass = { name: className, level: className, sortOrder: formData.classes.length + 1 }
      updateFormData({ classes: [...formData.classes, newClass] })
    }
  }

  let templateList: Array<string> = []
  if (formData.schoolCategory && formData.schoolCategory.length > 0) {
    formData.schoolCategory.forEach(category => {
      const temp = CLASS_TEMPLATES[category as keyof typeof CLASS_TEMPLATES]
      if (temp) {
        templateList = [...templateList, ...temp]
      }
    })
  } else {
    templateList = CLASS_TEMPLATES['COMBINED']
  }

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Academic Session</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label>Session Name</Label>
            <Input
              placeholder="e.g 2026/2027"
              value={formData.sessionName}
              onChange={(e) => updateFormData({ sessionName: e.target.value })}
              required
            />
          </div>
          <div className="hidden md:block"></div>
          
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label>Session Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.sessionStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sessionStartDate ? format(new Date(formData.sessionStartDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.sessionStartDate ? new Date(formData.sessionStartDate) : undefined}
                  onSelect={(date) => updateFormData({ sessionStartDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label>Session End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.sessionEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sessionEndDate ? format(new Date(formData.sessionEndDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.sessionEndDate ? new Date(formData.sessionEndDate) : undefined}
                  onSelect={(date) => updateFormData({ sessionEndDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Terms / Semesters</h3>
        <p className="text-sm text-muted-foreground">You can set exact dates later.</p>
        <div className="space-y-3">
          {formData.terms.map((term, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <Input
                value={term.name}
                onChange={(e) => {
                  const newTerms = [...formData.terms]
                  newTerms[idx].name = e.target.value
                  updateFormData({ terms: newTerms })
                }}
                className="w-1/2"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Initial Classes</h3>
        <p className="text-sm text-muted-foreground">Select the classes your school currently offers. (You can add more later)</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {templateList.map((clsName) => {
            const isSelected = formData.classes.some(c => c.name === clsName)
            return (
              <label
                key={clsName}
                className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleClass(clsName)}
                />
                <span className="text-sm font-medium leading-none">{clsName}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" className="flex-1 h-11 md:h-12" onClick={() => navigate({ to: '/onboarding/branch' })}>
          Back
        </Button>
        <Button type="submit" className="flex-1 h-11 md:h-12" disabled={isPending}>
          {isPending ? 'Completing...' : 'Complete Registration'}
        </Button>
      </div>
    </form>
  )
}

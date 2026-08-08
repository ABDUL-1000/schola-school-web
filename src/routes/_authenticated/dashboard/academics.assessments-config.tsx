import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import {
  useAssessmentConfigQuery,
  useUpsertAssessmentConfigMutation,
} from '@/hooks/queries/assessment.queries'

export const Route = createFileRoute(
  '/_authenticated/dashboard/academics/assessments-config',
)({
  component: AssessmentsConfigRoute,
})

function AssessmentsConfigRoute() {
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')

  // Fetch terms and subjects
  const { data: academicData } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/school/academic/sessions')
      return data?.data
    },
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await api.get('/school/subject', {
        params: { limit: 100 },
      })
      return data?.data?.subjects || data?.data
    },
  })

  const terms = academicData?.flatMap((session: any) => session.terms) || []
  const subjects = subjectsData || []

  const { data: config, isLoading: isConfigLoading } = useAssessmentConfigQuery(
    selectedTermId,
    selectedSubjectId,
  )
  const upsertMutation = useUpsertAssessmentConfigMutation()

  // State for the components form
  const [components, setComponents] = useState<
    Array<{ name: string; maxScore: number }>
  >([])

  // Load components when config changes
  useEffect(() => {
    if (config?.components) {
      setComponents(config.components)
    } else if (selectedSubjectId) {
      // Defaults
      setComponents([
        { name: 'CA 1', maxScore: 10 },
        { name: 'CA 2', maxScore: 10 },
        { name: 'CA 3', maxScore: 10 },
        { name: 'Exam', maxScore: 70 },
      ])
    } else {
      setComponents([])
    }
  }, [config, selectedSubjectId])

  const handleAddComponent = () => {
    setComponents([...components, { name: '', maxScore: 0 }])
  }

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  const handleUpdateComponent = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const newComps = [...components]
    newComps[index] = { ...newComps[index], [field]: value }
    setComponents(newComps)
  }

  const handleSave = async () => {
    const total = components.reduce(
      (acc, curr) => acc + Number(curr.maxScore),
      0,
    )
    if (total !== 100) {
      toast.error(
        `Total max score must be exactly 100. Current total is ${total}.`,
      )
      return
    }

    try {
      await upsertMutation.mutateAsync({
        termId: selectedTermId,
        data: {
          subjectId: selectedSubjectId,
          components: components.map((c) => ({
            name: c.name,
            maxScore: Number(c.maxScore),
          })),
        },
      })
      toast.success('Assessment configuration saved successfully!')
    } catch (error) {
      toast.error('Failed to save configuration.')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Assessment Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Define the grading structure and weights for continuous assessments
          and exams.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Context</CardTitle>
          <CardDescription>
            Choose a term and subject to configure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Term</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedTermId || ''}
                onChange={(e) => setSelectedTermId(e.target.value)}
              >
                <option value="" disabled>
                  Select Term
                </option>
                {terms.map((term: any) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                <option value="" disabled>
                  Select Subject
                </option>
                {subjects.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTermId && selectedSubjectId && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Grading Components</CardTitle>
                <CardDescription>
                  Configure CAs and Exams. Total must equal 100.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddComponent}>
                <Plus className="w-4 h-4 mr-2" /> Add Component
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConfigLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {components.map((comp, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg border"
                  >
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">
                        Component Name (e.g., CA 1, Mid Term)
                      </Label>
                      <Input
                        value={comp.name}
                        onChange={(e) =>
                          handleUpdateComponent(index, 'name', e.target.value)
                        }
                        placeholder="e.g. First CA"
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      <Label className="text-xs">Max Score</Label>
                      <Input
                        type="number"
                        value={comp.maxScore}
                        onChange={(e) =>
                          handleUpdateComponent(
                            index,
                            'maxScore',
                            e.target.value,
                          )
                        }
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div className="pt-5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => handleRemoveComponent(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4 border-t mt-6">
                  <div className="text-sm font-medium">
                    Total:{' '}
                    <span
                      className={
                        components.reduce(
                          (acc, curr) => acc + Number(curr.maxScore),
                          0,
                        ) === 100
                          ? 'text-green-600'
                          : 'text-destructive'
                      }
                    >
                      {components.reduce(
                        (acc, curr) => acc + Number(curr.maxScore),
                        0,
                      )}{' '}
                      / 100
                    </span>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={upsertMutation.isPending}
                  >
                    {upsertMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

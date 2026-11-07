import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState, useEffect } from 'react'
import { NoBranchesHint } from '@/components/branches/no-branches-hint'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateStudentMutation } from '@/hooks/queries/student.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import { useUploadFileMutation } from '@/hooks/queries/upload.queries'
import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { countries, getEmojiFlag } from 'countries-list'
import { Loader2, ArrowLeft, UploadCloud, CheckCircle2, CalendarIcon, EyeOff, Eye, Copy, ChevronDown } from 'lucide-react'
import { toast } from '@/lib/toast'
import NaijaStates from 'naija-state-local-government'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Image } from '@unpic/react'

// One parent/guardian, all optional. The server skips it if nothing is filled in.
const guardianSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  occupation: z.string().optional(),
  address: z.string().optional(),
  isPrimary: z.boolean()
})

const documentSchema = z.object({
  documentType: z.string(),
  fileUrl: z.string(),
  fileName: z.string()
})

const studentSchema = z.object({
  branchId: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  departmentId: z.string().optional(),
  firstName: z.string().min(1, 'Required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Required'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  lga: z.string().optional(),
  religion: z.string().optional(),
  bloodGroup: z.string().optional(),
  genotype: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  regNumber: z.string().optional(),
  previousSchool: z.string().optional(),
  transferReason: z.string().optional(),
  knownAllergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  guardians: z.array(guardianSchema).max(1),
  documents: z.array(documentSchema)
})

type StudentFormValues = z.infer<typeof studentSchema>

export const Route = createFileRoute('/_authenticated/dashboard/students/new')({
  component: NewStudentComponent,
})

function NewStudentComponent() {
  const navigate = useNavigate()
  const createMutation = useCreateStudentMutation()
  const uploadMutation = useUploadFileMutation()

  const [showMore, setShowMore] = useState(false)
  const [successDetails, setSuccessDetails] = useState<{regNumber: string, tempPassword: string} | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      branchId: '', classId: '', departmentId: '',
      firstName: '', middleName: '', lastName: '',
      dateOfBirth: '', gender: '', nationality: '', stateOfOrigin: '', lga: '', religion: '', bloodGroup: '', genotype: '', address: '',
      email: '', phone: '', regNumber: '',
      previousSchool: '', transferReason: '', knownAllergies: '', medicalConditions: '',
      guardians: [{ firstName: '', lastName: '', relationship: '', phone: '', email: '', occupation: '', address: '', isPrimary: true }],
      documents: []
    }
  })

  const { control, handleSubmit, watch, setValue, register, formState: { errors } } = form
  
  useEffect(() => {
    register('branchId')
    register('classId')
    register('departmentId')
    register('gender')
    register('nationality')
    register('stateOfOrigin')
    register('lga')
    register('religion')
    register('bloodGroup')
    register('genotype')
  }, [register])

  const branchId = watch('branchId')
  const classId = watch('classId')
  const formDocuments = watch('documents')

  const { data: branches } = useBranchesQuery()
  // One branch (single-campus school): pick it for them.
  useEffect(() => {
    if (branches?.length === 1 && !branchId) setValue('branchId', branches[0].id)
  }, [branches])
  const { data: paginatedClasses } = useClassesQuery(branchId || undefined)
  const classes = paginatedClasses?.data || []
  
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/school/department')
      return res.data
    },
  })
  const departments = departmentsResponse?.departments || []

  const selectedClass = classes.find((c: any) => c.id === classId)
  const isSSS = selectedClass?.name.toUpperCase().includes('SSS') || selectedClass?.level === 'SSS'

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadMutation.mutateAsync(file)
      const newDoc = { documentType: docType, fileUrl: res || "", fileName: file.name }
      setValue('documents', [...formDocuments, newDoc])
    } catch (error) {
      toast.error("File upload failed")
    }
  }

  const onSubmit = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: (res: any) => {
        toast.success("Student enrolled successfully")
        const responseData = res?.data || res;
        if (responseData.tempPassword) {
          setSuccessDetails({
            regNumber: responseData.regNumber || responseData.student?.regNumber || data.regNumber,
            tempPassword: responseData.tempPassword
          })
        } else {
          navigate({ to: '/dashboard/students' })
        }
      },
      onError: (err: any) => {
        toast.error(err?.message || "Failed to create student")
      }
    })
  }

  // Validation errors can sit in the collapsed "More details" section — open it so they show.
  const onInvalid = (errs: any) => {
    const basic = ['branchId', 'classId', 'firstName', 'lastName']
    if (Object.keys(errs).some((k) => !basic.includes(k))) setShowMore(true)
    toast.error('Please check the highlighted fields')
  }
  if (successDetails) {
    return (
      <div className="space-y-6 pb-10 max-w-2xl mx-auto pt-8">
        <Card className="shadow-sm border-green-200">
          <CardHeader className="bg-green-50/50 border-b pb-6 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Student Enrolled Successfully!</CardTitle>
            <CardDescription className="text-green-700/80">
              Please securely share these credentials with the student or guardian.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="p-5 border rounded-lg bg-muted/30 space-y-5">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="font-medium text-muted-foreground">Registration Number</span>
                <span className="text-lg font-bold">{successDetails.regNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Initial Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-background px-3 py-1.5 rounded-md border text-lg">
                    {showPassword ? successDetails.tempPassword : '********'}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  {showPassword && (
                    <Button variant="outline" size="icon" onClick={() => {
                      navigator.clipboard.writeText(successDetails.tempPassword)
                      toast.success("Password copied to clipboard")
                    }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t p-6">
            <Button className="w-full" size="lg" onClick={() => navigate({ to: '/dashboard/students' })}>
              Done
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const err = (msg?: string) => (msg ? <p className="text-sm text-destructive">{msg}</p> : null)

  return (
    <div className="space-y-6 pb-10 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/students">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enrol a Student</h1>
          <p className="text-muted-foreground text-sm">
            Only the fields marked <span className="text-destructive">*</span> are needed. Everything else can be added now or later.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(branches?.length ?? 0) !== 1 && (
                <div className="space-y-2">
                  <Label>Branch <span className="text-destructive">*</span></Label>
                  <Select value={branchId} onValueChange={(val) => { setValue('branchId', val, { shouldValidate: true }); setValue('classId', '') }}>
                    <SelectTrigger className={cn(errors.branchId && "border-destructive focus:ring-destructive")}><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches?.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <NoBranchesHint branches={branches} />
                  {err(errors.branchId?.message)}
                </div>
              )}
              <div className="space-y-2">
                <Label>Class <span className="text-destructive">*</span></Label>
                <Select value={classId} onValueChange={(val) => setValue('classId', val, { shouldValidate: true })} disabled={!branchId}>
                  <SelectTrigger className={cn(errors.classId && "border-destructive focus:ring-destructive")}><SelectValue placeholder={branchId ? "Select class" : "Choose a branch first"} /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {branchId && classes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No classes yet. <Link to="/dashboard/classes" className="font-medium text-primary underline">Create a class</Link> first.
                  </p>
                )}
                {err(errors.classId?.message)}
              </div>
              {isSSS && (
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={watch('departmentId')} onValueChange={(val) => setValue('departmentId', val)}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input className={cn(errors.firstName && "border-destructive focus-visible:ring-destructive")} {...form.register('firstName')} />
                {err(errors.firstName?.message)}
              </div>
              <div className="space-y-2">
                <Label>Last Name <span className="text-destructive">*</span></Label>
                <Input className={cn(errors.lastName && "border-destructive focus-visible:ring-destructive")} {...form.register('lastName')} />
                {err(errors.lastName?.message)}
              </div>
              <div className="space-y-2"><Label>Middle Name</Label><Input {...form.register('middleName')} /></div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={watch('gender')} onValueChange={(val) => setValue('gender', val)}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Controller
                    control={control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Parent / Guardian</CardTitle>
            <CardDescription>Optional. A name and phone number is enough.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input {...form.register('guardians.0.firstName')} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input {...form.register('guardians.0.lastName')} placeholder="Defaults to the student's last name" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input type="tel" {...form.register('guardians.0.phone')} placeholder="080xxxxxxxx" /></div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                        <Controller
                          control={control}
                          name={`guardians.0.relationship`}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                {['Father', 'Mother', 'Uncle', 'Aunt', 'Brother', 'Sister', 'Guardian', 'Other'].map(r => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Email</Label>
                <Input type="email" {...form.register('guardians.0.email')} />
                {err(errors.guardians?.[0]?.email?.message)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Collapsible open={showMore} onOpenChange={setShowMore}>
          <Card className="shadow-sm">
            <CollapsibleTrigger asChild>
              <button type="button" className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left">
                <div>
                  <div className="text-lg font-semibold">More details <span className="text-sm font-normal text-muted-foreground">(optional)</span></div>
                  <p className="text-sm text-muted-foreground">Contact, origin, health, previous school and documents</p>
                </div>
                <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", showMore && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Student Email</Label>
                    <Input type="email" {...form.register('email')} />
                    {err(errors.email?.message)}
                  </div>
                  <div className="space-y-2"><Label>Student Phone</Label><Input type="tel" {...form.register('phone')} /></div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Select value={watch('nationality')} onValueChange={(val) => setValue('nationality', val)}>
                    <SelectTrigger><SelectValue placeholder="Select Nationality" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(countries)
                        .filter(([code, country]) => country.continent === 'AF' && code !== 'AC' && code !== 'TA')
                        .sort(([_, a], [__, b]) => a.name.localeCompare(b.name))
                        .map(([code, country]) => (
                          <SelectItem key={code} value={country.name}>
                            <div className="flex items-center gap-2">
                              <Image src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} width={20} height={15} layout="fixed" alt={country.name} />
                              <span>{country.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State of Origin</Label>
                  <Select value={watch('stateOfOrigin')} onValueChange={(val) => { setValue('stateOfOrigin', val); setValue('lga', '') }}>
                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                    <SelectContent>
                      {NaijaStates.states().map((s: string) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>LGA</Label>
                  <Select value={watch('lga')} onValueChange={(val) => setValue('lga', val)} disabled={!watch('stateOfOrigin')}>
                    <SelectTrigger><SelectValue placeholder="Select LGA" /></SelectTrigger>
                    <SelectContent>
                      {((watch('stateOfOrigin') ? NaijaStates.lgas(watch('stateOfOrigin') as string)?.lgas : []) || []).map((lga: string) => (
                        <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select value={watch('bloodGroup')} onValueChange={(val) => setValue('bloodGroup', val)}>
                    <SelectTrigger><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Genotype</Label>
                  <Select value={watch('genotype')} onValueChange={(val) => setValue('genotype', val)}>
                    <SelectTrigger><SelectValue placeholder="Select Genotype" /></SelectTrigger>
                    <SelectContent>
                      {['AA', 'AS', 'AC', 'SS', 'SC'].map((geno) => (
                        <SelectItem key={geno} value={geno}>{geno}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Select value={watch('religion')} onValueChange={(val) => setValue('religion', val)}>
                    <SelectTrigger><SelectValue placeholder="Select Religion" /></SelectTrigger>
                    <SelectContent>
                      {['Christianity', 'Islam', 'Traditional', 'Other'].map((rel) => (
                        <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  <div className="md:col-span-2 space-y-2"><Label>Home Address</Label><Textarea {...form.register('address')} /></div>
                  <div className="space-y-2"><Label>Parent's Occupation</Label><Input {...form.register('guardians.0.occupation')} /></div>
                  <div className="space-y-2"><Label>Previous School</Label><Input {...form.register('previousSchool')} /></div>
                  <div className="md:col-span-2 space-y-2"><Label>Reason for Transfer</Label><Textarea {...form.register('transferReason')} /></div>
                  <div className="space-y-2"><Label>Known Allergies</Label><Textarea {...form.register('knownAllergies')} placeholder="e.g. Peanuts, Penicillin" /></div>
                  <div className="space-y-2"><Label>Medical Conditions</Label><Textarea {...form.register('medicalConditions')} placeholder="e.g. Asthma" /></div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-medium">Documents</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['PASSPORT', 'BIRTH_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'IMMUNIZATION_RECORD'].map(docType => {
                    const existing = formDocuments.find((d: any) => d.documentType === docType);
                    return (
                      <div key={docType} className="p-4 border rounded-lg flex flex-col items-center justify-center space-y-2 text-center bg-muted/20">
                        <UploadCloud className="w-8 h-8 text-muted-foreground" />
                        <span className="font-medium">{docType.replace('_', ' ')}</span>
                        {existing ? (
                          <span className="text-xs text-green-600 font-semibold">{existing.fileName} Uploaded ✓</span>
                        ) : (
                          <div className="mt-2">
                            <Input type="file" className="text-xs max-w-[200px]" onChange={(e) => handleFileUpload(e, docType)} disabled={uploadMutation.isPending} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to="/dashboard/students"><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></Link>
          <Button type="submit" disabled={createMutation.isPending || uploadMutation.isPending} className="sm:min-w-40">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Enrol Student
          </Button>
        </div>
      </form>
    </div>
  )
}

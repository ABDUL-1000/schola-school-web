import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
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
import { Loader2, ArrowRight, ArrowLeft, UploadCloud, Plus, Trash2, CheckCircle2, CalendarIcon, EyeOff, Eye, Copy } from 'lucide-react'
import { toast } from '@/lib/toast'
import NaijaStates from 'naija-state-local-government'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Image } from '@unpic/react'

const guardianSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  relationship: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  email: z.string().email().optional().or(z.literal('')),
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
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  regNumber: z.string().optional(),
  previousSchool: z.string().optional(),
  transferReason: z.string().optional(),
  knownAllergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  guardians: z.array(guardianSchema).min(1, 'At least one guardian required'),
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

  const [step, setStep] = useState(1)
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
  const { fields: guardians, append: addGuardian, remove: removeGuardian } = useFieldArray({ control, name: 'guardians' })
  
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

  const handleNext = async () => {
    let fieldsToValidate: Array<any> = []
    if (step === 1) fieldsToValidate = ['branchId', 'classId', ...(isSSS ? ['departmentId'] : [])]
    else if (step === 2) fieldsToValidate = ['firstName', 'lastName']
    else if (step === 3) fieldsToValidate = ['guardians']

    const isStepValid = await form.trigger(fieldsToValidate as any)
    if (isStepValid) setStep(s => Math.min(s + 1, 6))
  }

  const handlePrev = () => setStep(s => Math.max(s - 1, 1))

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
            regNumber: responseData.student?.regNumber || data.regNumber,
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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/students">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Student Enrollment</h1>
          <p className="text-muted-foreground text-sm">Fill in the details to manually enrol a new student.</p>
        </div>
      </div>

      <div className="relative pt-4 pb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center z-10 space-y-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i}
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-8 left-0 right-0 h-1 bg-muted -z-10">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step - 1) / 5) * 100}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Academic Information"}
              {step === 2 && "Student Bio-Data"}
              {step === 3 && "Guardians Information"}
              {step === 4 && "Health & Previous School"}
              {step === 5 && "Document Uploads"}
              {step === 6 && "Review & Submit"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Step 1 */}
            <div className={step === 1 ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Branch <span className="text-destructive">*</span></Label>
                  <Select value={branchId} onValueChange={(val) => { setValue('branchId', val); setValue('classId', '') }}>
                    <SelectTrigger className={cn(errors.branchId && "border-destructive focus:ring-destructive")}><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches?.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.branchId && <p className="text-sm text-destructive">{errors.branchId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Class <span className="text-destructive">*</span></Label>
                  <Select value={classId} onValueChange={(val) => setValue('classId', val)} disabled={!branchId}>
                    <SelectTrigger className={cn(errors.classId && "border-destructive focus:ring-destructive")}><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.classId && <p className="text-sm text-destructive">{errors.classId.message}</p>}
                </div>
                {isSSS && (
                  <div className="space-y-2">
                    <Label>Department <span className="text-destructive">*</span></Label>
                    <Select value={watch('departmentId')} onValueChange={(val) => setValue('departmentId', val)}>
                      <SelectTrigger className={cn(errors.departmentId && "border-destructive focus:ring-destructive")}><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.departmentId && <p className="text-sm text-destructive">{errors.departmentId.message}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className={step === 2 ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name <span className="text-destructive">*</span></Label>
                  <Input className={cn(errors.firstName && "border-destructive focus-visible:ring-destructive")} {...form.register('firstName')} />
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2"><Label>Middle Name</Label><Input {...form.register('middleName')} /></div>
                <div className="space-y-2">
                  <Label>Last Name <span className="text-destructive">*</span></Label>
                  <Input className={cn(errors.lastName && "border-destructive focus-visible:ring-destructive")} {...form.register('lastName')} />
                  {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
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
                <div className="space-y-2"><Label>Reg Number (Auto generated)</Label><Input {...form.register('regNumber')} disabled placeholder="Auto generated upon creation" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" {...form.register('email')} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input {...form.register('phone')} /></div>
                <div className="md:col-span-2 space-y-2"><Label>Home Address</Label><Textarea {...form.register('address')} /></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={step === 3 ? 'block' : 'hidden'}>
              <div className="space-y-6">
                {guardians.map((guardian, idx) => (
                  <div key={guardian.id} className="p-4 border rounded-lg space-y-4 relative bg-background">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Guardian {idx + 1} {idx === 0 && "(Primary Contact)"}</h4>
                      {idx > 0 && <Button variant="ghost" size="icon" onClick={() => removeGuardian(idx)}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name <span className="text-destructive">*</span></Label>
                        <Input className={cn(errors.guardians?.[idx]?.firstName && "border-destructive focus-visible:ring-destructive")} {...form.register(`guardians.${idx}.firstName`)} />
                        {errors.guardians?.[idx]?.firstName && <p className="text-sm text-destructive">{errors.guardians[idx]?.firstName?.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name <span className="text-destructive">*</span></Label>
                        <Input className={cn(errors.guardians?.[idx]?.lastName && "border-destructive focus-visible:ring-destructive")} {...form.register(`guardians.${idx}.lastName`)} />
                        {errors.guardians?.[idx]?.lastName && <p className="text-sm text-destructive">{errors.guardians[idx]?.lastName?.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Relationship <span className="text-destructive">*</span></Label>
                        <Controller
                          control={control}
                          name={`guardians.${idx}.relationship`}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className={cn(errors.guardians?.[idx]?.relationship && "border-destructive focus-visible:ring-destructive")}>
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
                        {errors.guardians?.[idx]?.relationship && <p className="text-sm text-destructive">{errors.guardians[idx]?.relationship?.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Phone <span className="text-destructive">*</span></Label>
                        <Input className={cn(errors.guardians?.[idx]?.phone && "border-destructive focus-visible:ring-destructive")} {...form.register(`guardians.${idx}.phone`)} />
                        {errors.guardians?.[idx]?.phone && <p className="text-sm text-destructive">{errors.guardians[idx]?.phone?.message}</p>}
                      </div>
                      <div className="space-y-2"><Label>Email</Label><Input type="email" {...form.register(`guardians.${idx}.email`)} /></div>
                      <div className="space-y-2"><Label>Occupation</Label><Input {...form.register(`guardians.${idx}.occupation`)} /></div>
                      <div className="md:col-span-2 space-y-2"><Label>Address</Label><Textarea {...form.register(`guardians.${idx}.address`)} /></div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" type="button" onClick={() => addGuardian({ firstName: '', lastName: '', relationship: '', phone: '', email: '', occupation: '', address: '', isPrimary: false })} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2" /> Add Another Guardian</Button>
              </div>
            </div>

            {/* Step 4 */}
            <div className={step === 4 ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Previous School Attended (if any)</Label><Input {...form.register('previousSchool')} /></div>
                <div className="space-y-2"><Label>Reason for Transfer</Label><Textarea {...form.register('transferReason')} /></div>
                <div className="space-y-2"><Label>Known Allergies</Label><Textarea {...form.register('knownAllergies')} placeholder="e.g. Peanuts, Penicillin" /></div>
                <div className="space-y-2"><Label>Existing Medical Conditions</Label><Textarea {...form.register('medicalConditions')} placeholder="e.g. Asthma" /></div>
              </div>
            </div>

            {/* Step 5 */}
            <div className={step === 5 ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">Upload any available documents. (Max 5MB each). You can skip this step.</p>
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
            </div>

            {/* Step 6 */}
            <div className={step === 6 ? 'block' : 'hidden'}>
              <div className="space-y-6 text-sm">
                <div className="p-4 bg-muted/20 rounded-lg space-y-2 border">
                  <h3 className="font-semibold text-base border-b pb-2">Summary</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <span className="text-muted-foreground">Student Name:</span>
                    <span className="font-medium">{watch('firstName')} {watch('lastName')}</span>
                    <span className="text-muted-foreground">Class:</span>
                    <span className="font-medium">{selectedClass?.name || 'None'}</span>
                    <span className="text-muted-foreground">Primary Guardian:</span>
                    <span className="font-medium">{watch('guardians')[0]?.firstName} {watch('guardians')[0]?.phone}</span>
                    <span className="text-muted-foreground">Documents Uploaded:</span>
                    <span className="font-medium">{formDocuments.length}</span>
                  </div>
                </div>
                <p className="text-muted-foreground">By submitting this form, you will enrol the student directly.</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-muted/10 p-6">
            <Button variant="outline" type="button" onClick={handlePrev} disabled={step === 1 || createMutation.isPending}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="space-x-2">
              {step < 6 ? (
                <Button type="button" onClick={handleNext}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Enrol Student"}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

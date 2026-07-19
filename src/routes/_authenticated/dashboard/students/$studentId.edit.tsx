import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useStudentByIdQuery, useEditStudentMutation } from '@/hooks/queries/student.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import { useUploadFileMutation } from '@/hooks/queries/upload.queries'
import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Plus, Trash2, CalendarIcon, User, ShieldCheck, Activity, FileText } from 'lucide-react'
import { toast } from '@/lib/toast'
import NaijaStates from 'naija-state-local-government'
import { countries } from 'countries-list'
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

const tabsSchema = z.object({
  tab: z.enum(['bio-data', 'guardians', 'health', 'documents']).catch('bio-data')
})

export const Route = createFileRoute('/_authenticated/dashboard/students/$studentId/edit')({
  validateSearch: tabsSchema,
  component: EditStudentComponent,
})

const STUDENT_TABS = [
  { id: 'bio-data', label: 'Bio-Data', icon: User },
  { id: 'guardians', label: 'Guardians', icon: ShieldCheck },
  { id: 'health', label: 'Health & Academics', icon: Activity },
  { id: 'documents', label: 'Documents', icon: FileText },
] as const

function EditStudentComponent() {
  const { studentId } = Route.useParams()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  
  const handleTabChange = (newTab: string) => {
    navigate({ search: { tab: newTab } })
  }
  
  const { data: response, isLoading } = useStudentByIdQuery(studentId)
  const student = (response as any)?.student || response
  const editMutation = useEditStudentMutation()
  const uploadMutation = useUploadFileMutation()

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      branchId: '', classId: '', departmentId: '',
      firstName: '', middleName: '', lastName: '',
      dateOfBirth: '', gender: '', nationality: '', stateOfOrigin: '', lga: '', religion: '', bloodGroup: '', genotype: '', address: '',
      email: '', phone: '', regNumber: '',
      previousSchool: '', transferReason: '', knownAllergies: '', medicalConditions: '',
      guardians: [],
      documents: []
    }
  })

  const { control, handleSubmit, watch, setValue, reset, register, formState: { errors, isDirty } } = form
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

    if (student) {
      reset({
        branchId: student.branchId || '',
        classId: student.classId || '',
        departmentId: student.department?.id || '',
        firstName: student.firstName || student.fullname?.split(' ')[0] || '',
        middleName: student.middleName || '',
        lastName: student.lastName || student.fullname?.split(' ').slice(1).join(' ') || '',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        gender: student.gender || '',
        nationality: student.nationality || '',
        stateOfOrigin: student.stateOfOrigin || '',
        lga: student.lga || '',
        religion: student.religion || '',
        bloodGroup: student.bloodGroup || '',
        genotype: student.genotype || '',
        address: student.address || '',
        email: student.email || '',
        phone: student.phone || '',
        regNumber: student.regNumber || '',
        previousSchool: student.previousSchool || '',
        transferReason: student.transferReason || '',
        knownAllergies: student.knownAllergies || '',
        medicalConditions: student.medicalConditions || '',
        guardians: student.guardians?.length ? student.guardians : [{ firstName: '', lastName: '', relationship: '', phone: '', email: '', occupation: '', address: '', isPrimary: true }],
        documents: student.documents || []
      })
    }
  }, [student, reset, register])

  const branchId = watch('branchId')
  const classId = watch('classId')
  const stateOfOrigin = watch('stateOfOrigin')
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

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadMutation.mutateAsync(file)
      const newDoc = { documentType: docType, fileUrl: res || "", fileName: file.name }
      setValue('documents', [...formDocuments, newDoc], { shouldDirty: true })
    } catch (error) {
      toast.error("File upload failed")
    }
  }

  const onSubmit = (data: any) => {
    const payload = { ...data };
    
    // Clean up empty strings that should be null/undefined for the backend UUIDs
    if (payload.departmentId === '') payload.departmentId = null;
    if (payload.dateOfBirth === '') payload.dateOfBirth = null;
    if (payload.lga === '') payload.lga = null;
    if (payload.stateOfOrigin === '') payload.stateOfOrigin = null;
    if (payload.religion === '') payload.religion = null;
    if (payload.bloodGroup === '') payload.bloodGroup = null;
    if (payload.genotype === '') payload.genotype = null;

    editMutation.mutate({ studentId, data: payload }, {
      onSuccess: () => {
        toast.success("Student updated successfully")
        navigate({ to: `/dashboard/students/${studentId}`, search: { tab: tab } })
      },
      onError: (err: any) => {
        toast.error(err?.message || "Failed to update student")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl pb-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard/students">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Edit Student Details
              </h1>
            </div>
          </div>
          <Button onClick={handleSubmit(onSubmit)} disabled={!isDirty || editMutation.isPending}>
            {editMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>

        {/* Scrollable Tabs Container with Edge Fade */}
        <div className="relative border-b w-full mt-4">
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{
              maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
            }}
          >
            <nav className="flex items-center min-w-max pb-px" aria-label="Student Tabs">
              {STUDENT_TABS.map((t) => {
                const isActive = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={(e) => { e.preventDefault(); handleTabChange(t.id); }}
                    className={cn(
                      'relative px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap outline-none cursor-pointer',
                      isActive
                        ? 'text-foreground bg-accent/50 rounded-t-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/25 rounded-t-md',
                    )}
                  >
                    <t.icon className="size-4" />
                    <span className="hidden sm:inline-block">{t.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="py-2 transition-all duration-300">
        <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Bio-Data Tab */}
          {tab === 'bio-data' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>First Name <span className="text-destructive">*</span></Label>
                  <Input {...form.register('firstName')} aria-invalid={!!errors.firstName} />
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input {...form.register('middleName')} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name <span className="text-destructive">*</span></Label>
                  <Input {...form.register('lastName')} aria-invalid={!!errors.lastName} />
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
                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : '')}
                            disabled={(date) => date > new Date()}
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
                    <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nigeria">
                        <div className="flex items-center gap-2">
                          <Image src={`https://flagcdn.com/w20/ng.png`} width={20} height={15} layout="fixed" alt="Nigeria" />
                          <span>Nigeria</span>
                        </div>
                      </SelectItem>
                      {Object.entries(countries)
                        .filter(([code, country]) => country.continent === 'AF' && code !== 'AC' && code !== 'TA' && code !== 'NG')
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
                  <Select value={stateOfOrigin} onValueChange={(val) => { setValue('stateOfOrigin', val); setValue('lga', '') }}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {NaijaStates.states().map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>LGA</Label>
                  <Select value={watch('lga')} onValueChange={(val) => setValue('lga', val)} disabled={!stateOfOrigin}>
                    <SelectTrigger><SelectValue placeholder="Select LGA" /></SelectTrigger>
                    <SelectContent>
                      {stateOfOrigin && NaijaStates.lgas(stateOfOrigin)?.lgas?.map((l: string) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Select value={watch('religion')} onValueChange={(val) => setValue('religion', val)}>
                    <SelectTrigger><SelectValue placeholder="Select religion" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Christianity">Christianity</SelectItem>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select value={watch('bloodGroup')} onValueChange={(val) => setValue('bloodGroup', val)}>
                    <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Genotype</Label>
                  <Select value={watch('genotype')} onValueChange={(val) => setValue('genotype', val)}>
                    <SelectTrigger><SelectValue placeholder="Select genotype" /></SelectTrigger>
                    <SelectContent>
                      {['AA', 'AS', 'SS', 'AC', 'SC'].map(gt => (
                        <SelectItem key={gt} value={gt}>{gt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contact Address</Label>
                <Textarea {...form.register('address')} rows={3} />
              </div>
            </div>
          )}

          {/* Guardians Tab */}
          {tab === 'guardians' && (
            <div className="space-y-6">
              {guardians.map((guardian, index) => (
                <div key={guardian.id} className="p-4 border rounded-lg relative space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Guardian {index + 1} {index === 0 && "(Primary)"}</h3>
                    {index > 0 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeGuardian(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name <span className="text-destructive">*</span></Label>
                      <Input {...form.register(`guardians.${index}.firstName`)} aria-invalid={!!errors?.guardians?.[index]?.firstName} />
                      {errors?.guardians?.[index]?.firstName && <p className="text-sm text-destructive">{errors.guardians[index]?.firstName?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name <span className="text-destructive">*</span></Label>
                      <Input {...form.register(`guardians.${index}.lastName`)} aria-invalid={!!errors?.guardians?.[index]?.lastName} />
                      {errors?.guardians?.[index]?.lastName && <p className="text-sm text-destructive">{errors.guardians[index]?.lastName?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship <span className="text-destructive">*</span></Label>
                      <Controller
                        control={control}
                        name={`guardians.${index}.relationship`}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                            <SelectContent>
                              {['Father', 'Mother', 'Uncle', 'Aunt', 'Brother', 'Sister', 'Guardian', 'Other'].map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone <span className="text-destructive">*</span></Label>
                      <Input {...form.register(`guardians.${index}.phone`)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" {...form.register(`guardians.${index}.email`)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input {...form.register(`guardians.${index}.occupation`)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Home Address</Label>
                    <Textarea {...form.register(`guardians.${index}.address`)} rows={2} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => addGuardian({ firstName: '', lastName: '', relationship: '', phone: '', email: '', occupation: '', address: '', isPrimary: false })}>
                <Plus className="w-4 h-4 mr-2" /> Add Another Guardian
              </Button>
            </div>
          )}

          {/* Health & Academics Tab */}
          {tab === 'health' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg border-b pb-2">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Branch <span className="text-destructive">*</span></Label>
                  <Select value={branchId} onValueChange={(val) => { setValue('branchId', val); setValue('classId', '') }} aria-invalid={!!errors.branchId}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches?.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.branchId && <p className="text-sm text-destructive">{errors.branchId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Class <span className="text-destructive">*</span></Label>
                  <Select value={classId} onValueChange={(val) => setValue('classId', val)} disabled={!branchId} aria-invalid={!!errors.classId}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.classId && <p className="text-sm text-destructive">{errors.classId.message}</p>}
                </div>
                {isSSS && (
                  <div className="space-y-2">
                    <Label>Department <span className="text-destructive">*</span></Label>
                    <Select value={watch('departmentId')} onValueChange={(val) => setValue('departmentId', val)} aria-invalid={!!errors.departmentId}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.departmentId && <p className="text-sm text-destructive">{errors.departmentId.message}</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Registration Number</Label>
                  <Input {...form.register('regNumber')} placeholder="Auto-generated if left blank" />
                </div>
              </div>
              
              <h3 className="font-semibold text-lg border-b pb-2 mt-8">Previous School Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Previous School Attended</Label>
                  <Input {...form.register('previousSchool')} />
                </div>
                <div className="space-y-2">
                  <Label>Reason for Transfer</Label>
                  <Input {...form.register('transferReason')} />
                </div>
              </div>

              <h3 className="font-semibold text-lg border-b pb-2 mt-8">Health Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Known Allergies</Label>
                  <Textarea {...form.register('knownAllergies')} rows={2} placeholder="List any food or medication allergies" />
                </div>
                <div className="space-y-2">
                  <Label>Existing Medical Conditions</Label>
                  <Textarea {...form.register('medicalConditions')} rows={2} placeholder="E.g. Asthma, Epilepsy" />
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {tab === 'documents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'BIRTH_CERTIFICATE', label: 'Birth Certificate' },
                  { id: 'MEDICAL_REPORT', label: 'Medical Report / Immunization' },
                  { id: 'PASSPORT', label: 'Passport Photograph' },
                  { id: 'TRANSFER_CERTIFICATE', label: 'Transfer Certificate / Last Result' }
                ].map(docType => {
                  const existingDoc = formDocuments.find((d: any) => d.documentType === docType.id)
                  return (
                    <div key={docType.id} className="p-4 border rounded-lg bg-card/50">
                      <div className="flex flex-col gap-2">
                        <Label className="font-medium text-base">{docType.label}</Label>
                        {existingDoc ? (
                          <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                            <span className="text-sm truncate mr-2">{existingDoc.fileName}</span>
                            <div className="flex items-center gap-2">
                              <a href={existingDoc.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">View</a>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setValue('documents', formDocuments.filter((d: any) => d.documentType !== docType.id), { shouldDirty: true })}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <Input 
                              type="file" 
                              className="cursor-pointer"
                              onChange={(e) => handleFileUpload(e, docType.id)}
                            />
                            {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-2.5 text-muted-foreground" />}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

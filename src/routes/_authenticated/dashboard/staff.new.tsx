import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateStaffMutation } from '@/hooks/queries/staff.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from '@/lib/toast'

const staffSchema = z.object({
  branchId: z.string().min(1, 'Required'),
  departmentId: z.string().optional(),
  fullname: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email').min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  roles: z.string().min(1, 'Required'),
  jobTitle: z.string().optional(),
})

type StaffFormValues = z.infer<typeof staffSchema>

export const Route = createFileRoute('/_authenticated/dashboard/staff/new')({
  component: NewStaffComponent,
})

function NewStaffComponent() {
  const navigate = useNavigate()
  const createMutation = useCreateStaffMutation()
  const [successMode, setSuccessMode] = useState(false)
  const [createdStaffName, setCreatedStaffName] = useState('')

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      branchId: '',
      departmentId: '',
      fullname: '',
      email: '',
      phone: '',
      roles: 'TEACHER',
      jobTitle: '',
    }
  })

  const { handleSubmit, register, watch, setValue, formState: { errors } } = form

  const { data: branches } = useBranchesQuery()
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/school/department')
      return res.data
    },
  })
  const departments = deptData?.departments || []

  const onSubmit = async (data: StaffFormValues) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        roles: data.roles as any
      })
      setCreatedStaffName(data.fullname)
      setSuccessMode(true)
      toast.success('Staff created successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create staff')
    }
  }

  if (successMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="size-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="size-12 text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Staff Member Added!</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            {createdStaffName} has been successfully added to your school's staff directory.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
          <Link to="/dashboard/staff">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">Return to Staff List</Button>
          </Link>
          <Button size="lg" className="w-full sm:w-auto" onClick={() => { setSuccessMode(false); form.reset() }}>
            Add Another Staff
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl pb-12">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/staff">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Add New Staff Member
          </h1>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle>Staff Details</CardTitle>
          <CardDescription>Enter the primary information for the new staff member.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Branch <span className="text-destructive">*</span></Label>
                <CustomSelect
                  value={watch('branchId')}
                  onValueChange={(val) => setValue('branchId', val)}
                  items={[
                    { label: 'Select branch', value: '' },
                    ...(branches || []).map((b: any) => ({ label: b.name, value: b.id }))
                  ]}
                />
                {errors.branchId && <p className="text-sm text-destructive">{errors.branchId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input {...register('fullname')} placeholder="e.g. John Doe" />
                {errors.fullname && <p className="text-sm text-destructive">{errors.fullname.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" {...register('email')} placeholder="john@school.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Phone <span className="text-destructive">*</span></Label>
                <Input {...register('phone')} placeholder="080xxxxxxxx" />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Role <span className="text-destructive">*</span></Label>
                <CustomSelect
                  value={watch('roles')}
                  onValueChange={(val) => setValue('roles', val)}
                  items={[
                    { label: 'Teacher', value: 'TEACHER' },
                    { label: 'Admin', value: 'ADMIN' }
                  ]}
                />
                {errors.roles && <p className="text-sm text-destructive">{errors.roles.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input {...register('jobTitle')} placeholder="e.g. Mathematics Teacher" />
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <CustomSelect
                  value={watch('departmentId') || ''}
                  onValueChange={(val) => setValue('departmentId', val)}
                  items={[
                    { label: 'None', value: '' },
                    ...(departments || []).map((d: any) => ({ label: d.name, value: d.id }))
                  ]}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={createMutation.isPending} size="lg">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Staff Member
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

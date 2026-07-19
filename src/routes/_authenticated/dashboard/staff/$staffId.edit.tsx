import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useStaffByIdQuery, useEditStaffMutation } from '@/hooks/queries/staff.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useUploadFileMutation } from '@/hooks/queries/upload.queries'
import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Loader2, ArrowLeft, Camera } from 'lucide-react'
import { toast } from '@/lib/toast'

const staffSchema = z.object({
  branchId: z.string().min(1, 'Required'),
  departmentId: z.string().optional(),
  fullname: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email').min(1, 'Required').or(z.literal('')),
  phone: z.string().min(1, 'Required'),
  roles: z.string().min(1, 'Required'),
  jobTitle: z.string().optional(),
  profileImage: z.string().optional(),
})

type StaffFormValues = z.infer<typeof staffSchema>

export const Route = createFileRoute('/_authenticated/dashboard/staff/$staffId/edit')({
  component: EditStaffComponent,
})

function EditStaffComponent() {
  const { staffId } = Route.useParams()
  const navigate = useNavigate()
  
  const { data: response, isLoading: isStaffLoading } = useStaffByIdQuery(staffId)
  const editMutation = useEditStaffMutation()
  const uploadMutation = useUploadFileMutation()

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
      profileImage: '',
    }
  })

  const { handleSubmit, register, watch, setValue, reset, formState: { errors, isDirty } } = form

  useEffect(() => {
    if (response) {
      const staff = (response as any).data || (response as any).staff || response
      reset({
        branchId: staff.branchId || '',
        departmentId: (staff as any).departmentId || '',
        fullname: staff.fullname || '',
        email: staff.email || '',
        phone: staff.phone || '',
        roles: staff.roles || 'TEACHER',
        jobTitle: (staff as any).contract?.jobTitle || staff.jobTitle || '',
        profileImage: staff.profileImage || '',
      })
    }
  }, [response, reset])

  const { data: branches } = useBranchesQuery()
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/school/department')
      return res.data
    },
  })
  const departments = deptData?.departments || []

  const profileImage = watch('profileImage')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadMutation.mutateAsync(file)
      setValue('profileImage', res, { shouldDirty: true })
      toast.success('Profile picture uploaded')
    } catch (error) {
      toast.error('Failed to upload image')
    }
  }

  const onSubmit = async (data: StaffFormValues) => {
    try {
      const payload = { ...data };
      if (payload.departmentId === '') payload.departmentId = null as any;
      
      await editMutation.mutateAsync({ staffId, data: payload as any })
      toast.success('Staff updated successfully')
      navigate({ to: `/dashboard/staff/${staffId}` })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update staff')
    }
  }

  if (isStaffLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl pb-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/dashboard/staff/${staffId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Edit Staff Details
            </h1>
          </div>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={!isDirty || editMutation.isPending}>
          {editMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle>Staff Information</CardTitle>
          <CardDescription>Update the staff member's profile and details.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-8">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center gap-4 py-4 border-b">
              <div className="relative group">
                <div className="size-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-background shadow-sm">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserPlaceholder />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  {uploadMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadMutation.isPending} />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">Click to upload a new profile picture</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Branch <span className="text-destructive">*</span></Label>
                <CustomSelect
                  value={watch('branchId')}
                  onValueChange={(val) => setValue('branchId', val, { shouldDirty: true })}
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
                  onValueChange={(val) => setValue('roles', val, { shouldDirty: true })}
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
                  onValueChange={(val) => setValue('departmentId', val, { shouldDirty: true })}
                  items={[
                    { label: 'None', value: '' },
                    ...(departments || []).map((d: any) => ({ label: d.name, value: d.id }))
                  ]}
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function UserPlaceholder() {
  return (
    <svg className="w-16 h-16 text-muted-foreground/50" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
  )
}

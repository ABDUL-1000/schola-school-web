import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from '@/hooks/queries/profile.queries'
import { useUploadFileMutation } from '@/hooks/queries/upload.queries'
import { toast } from '@/lib/toast'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import NaijaStates from 'naija-state-local-government'
import { countries } from 'countries-list'
import { Image } from '@unpic/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Frame, FramePanel } from '@/components/reui/frame'
import { SchoolProfileAvatar } from '@/components/school-profile-avatar'
import {
  Loader2,
  Pencil,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  Tag,
  // DollarSign,
  Camera,
  School,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────

// function formatCurrency(value: number | string | null | undefined): string {
//   if (!value) return '₦0'
//   const num = typeof value === 'string' ? parseFloat(value) : value
//   return `₦${num.toLocaleString()}`
// }

function formatSchoolType(type: string | null | undefined): string {
  switch (type) {
    case 'SINGLE_BRANCH':
      return 'Single Branch'
    case 'MULTI_BRANCH':
      return 'Multi Branch'
    default:
      return '—'
  }
}

function getStatusVariant(
  status: string | null | undefined,
): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'ACTIVE':
      return 'default'
    case 'INACTIVE':
      return 'secondary'
    case 'SUSPENDED':
      return 'destructive'
    default:
      return 'secondary'
  }
}

// ─── Profile Detail Row ──────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="text-muted-foreground mt-0.5 shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm font-medium">{value || '—'}</span>
      </div>
    </div>
  )
}

// ─── Discard Confirmation Dialog ─────────────────────────

function DiscardChangesDialog({
  onDiscard,
  children,
}: {
  onDiscard: () => void
  children: React.ReactNode
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="overflow-hidden p-0! ring-0">
        <Frame className="p-px">
          <FramePanel>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-500 dark:bg-amber-950 dark:text-amber-300">
                <AlertTriangle className="size-5" />
              </div>
              <div className="flex flex-col justify-center gap-1">
                <AlertDialogTitle className="text-sm font-semibold">
                  Unsaved changes
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm">
                  You have unsaved changes. If you cancel now, your progress
                  will be lost.
                </AlertDialogDescription>
              </div>
            </div>
            <AlertDialogFooter className="mt-6 flex items-center gap-2 sm:justify-end">
              <AlertDialogCancel>Stay</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onDiscard}>
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </FramePanel>
        </Frame>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Main Component ──────────────────────────────────────

export function ProfileTab() {
  const { data: profile, isLoading: isFetchingProfile } = useProfileQuery()
  const { mutateAsync: updateProfile, isPending: isUpdating } =
    useUpdateProfileMutation()
  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadFileMutation()

  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullname: '',
    schoolName: '',
    phone: '',
    address: '',
    country: '',
    state: '',
    city: '',
    schoolType: '' as string,
    logo: '' as string | undefined, // Now directly tracked
    // lateFee: 0,
  })

  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const resetForm = useCallback(() => {
    if (profile) {
      setFormData({
        fullname: profile.fullname || '',
        schoolName: profile.schoolName || '',
        phone: profile.phone || '',
        address: profile.address || '',
        country: profile.country || '',
        state: profile.state || '',
        city: profile.city || '',
        schoolType: profile.schoolType || '',
        logo: profile.logo || '',
        // lateFee: (profile as any).lateFee || 0,
      })
      setLogoPreview(profile.logo || null)
    }
    setErrors({})
  }, [profile])

  useEffect(() => {
    resetForm()
  }, [resetForm])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    if (name === 'lateFee') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? undefined : Number(value),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validate = () => {
    const newErrors: Record<string, boolean> = {}
    if (!formData.fullname) newErrors.fullname = true
    if (!formData.schoolName) newErrors.schoolName = true
    if (!formData.phone) newErrors.phone = true
    if (!formData.address) newErrors.address = true
    if (!formData.country) newErrors.country = true
    if (!formData.state) newErrors.state = true
    if (!formData.city) newErrors.city = true

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0

    if (!isValid) {
      toast.error('Please fill in all required fields', {
        description: 'Missing fields are highlighted in red.',
      })
    }
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const payload = { ...formData }
      const promise = updateProfile(payload as any)

      toast.promise(promise, {
        loading: 'Updating profile...',
        success: 'Profile updated successfully!',
        error: (err: any) => err.message || 'Failed to update profile',
      })
      await promise
      setIsEditing(false)
    } catch (error) {
      console.error('Update failed', error)
    }
  }

  const handleDiscard = () => {
    resetForm()
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsEditing(false)
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a local blob url for quick previewing immediately
      const url = URL.createObjectURL(file)
      setLogoPreview(url)

      // Upload the file, then immediately persist it to the school profile.
      // The rest of the form still requires an explicit "Save Changes", but
      // the logo must not depend on that — otherwise a successful upload
      // toast is misleading and the logo is silently lost if the user
      // doesn't also submit the form.
      try {
        const uploadedUrl = await uploadFile(file)
        if (uploadedUrl) {
          setFormData((prev) => ({ ...prev, logo: uploadedUrl }))
          await updateProfile({ logo: uploadedUrl } as any)
          toast.success('Logo uploaded successfully!')
        }
      } catch (err: any) {
        toast.error('Failed to upload logo image')
        // Revert preview if upload fails
        setLogoPreview(formData.logo || profile?.logo || null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
  }

  // ─── Loading State ───────────────────────────────────

  if (isFetchingProfile) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-2">Loading profile...</p>
      </div>
    )
  }

  // ─── View Mode ───────────────────────────────────────

  if (!isEditing) {
    return (
      <div className="py-2 md:py-4 transition-all duration-300">
        <div className="max-w-4xl">
          {/* Avatar + Name Header + Edit Button */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-5">
              <SchoolProfileAvatar
                src={profile?.logo}
                schoolName={profile?.schoolName || 'School'}
                isVerified={profile?.isVerified}
                className="size-16 md:size-24 text-xl md:text-2xl"
              />
              <div className="flex flex-col gap-0.5 md:gap-1 min-w-0">
                <h2 className="text-lg md:text-2xl font-bold truncate">
                  {profile?.schoolName}
                </h2>
                <p className="text-muted-foreground text-xs md:text-sm truncate">
                  {profile?.email}
                </p>
                {profile?.slug && (
                  <p className="text-muted-foreground text-xs">
                    /{profile.slug}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="gap-2 w-fit mt-2 sm:mt-0"
              size="sm"
            >
              <Pencil className="size-4" />
              Edit Profile
            </Button>
          </div>

          {/* Details Grid */}
          <div className="divide-border grid grid-cols-1 divide-y md:grid-cols-2 md:divide-y-0">
            <div className="divide-border divide-y">
              <DetailRow
                icon={Building2}
                label="Admin Name"
                value={profile?.fullname}
              />
              <DetailRow
                icon={Building2}
                label="School Name"
                value={profile?.schoolName}
              />
              <DetailRow icon={Mail} label="Email" value={profile?.email} />
              <DetailRow icon={Phone} label="Phone" value={profile?.phone} />
              <DetailRow
                icon={School}
                label="School Type"
                value={formatSchoolType(profile?.schoolType)}
              />
              {/* <DetailRow
                icon={DollarSign}
                label="Late Fee"
                value={formatCurrency((profile as any)?.lateFee)}
              /> */}
            </div>
            <div className="divide-border divide-y md:pl-8">
              <DetailRow
                icon={MapPin}
                label="Address"
                value={profile?.address}
              />
              <DetailRow icon={Globe} label="Country" value={profile?.country} />
              <DetailRow icon={Globe} label="State" value={profile?.state} />
              <DetailRow
                icon={MapPin}
                label="LGA / City"
                value={profile?.city}
              />
              <DetailRow
                icon={Tag}
                label="Slug"
                value={profile?.slug ? `/${profile.slug}` : undefined}
              />
              <DetailRow
                icon={Tag}
                label="Status"
                value={
                  <Badge
                    variant={getStatusVariant(profile?.status)}
                    className={cn(
                      profile?.status === 'ACTIVE' &&
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {profile?.status || 'Unknown'}
                  </Badge>
                }
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Edit Mode ───────────────────────────────────────

  return (
    <div className="py-4 md:py-6 transition-all duration-300">
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>School Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative inline-block">
                <SchoolProfileAvatar
                  src={logoPreview || profile?.logo}
                  schoolName={profile?.schoolName || 'School'}
                  className="size-16 md:size-24 text-xl"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  aria-label="Upload logo"
                >
                  {isUploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/svg+xml"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                />
                <p className="text-muted-foreground text-xs">
                  JPG, PNG or SVG. Max 2MB.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullname">Admin Full Name</Label>
              <Input
                id="fullname"
                name="fullname"
                placeholder="e.g. John Doe"
                value={formData.fullname}
                onChange={handleInputChange}
                className={cn(
                  'h-11! text-base transition-all focus-visible:ring-primary md:h-12!',
                  errors.fullname &&
                    'border-red-500 focus-visible:ring-red-500',
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                name="schoolName"
                placeholder="e.g. Global Academy"
                value={formData.schoolName}
                onChange={handleInputChange}
                className={cn(
                  'h-11! text-base transition-all focus-visible:ring-primary md:h-12!',
                  errors.schoolName &&
                    'border-red-500 focus-visible:ring-red-500',
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+234..."
                value={formData.phone}
                onChange={handleInputChange}
                className={cn(
                  'h-11! text-base transition-all focus-visible:ring-primary md:h-12!',
                  errors.phone && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolType">School Type</Label>
              <Select
                value={formData.schoolType}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, schoolType: value }))
                }}
              >
                <SelectTrigger className="h-11! w-full text-base transition-all focus:ring-primary md:h-12!">
                  <SelectValue placeholder="Select School Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_BRANCH">Single Branch</SelectItem>
                  <SelectItem value="MULTI_BRANCH">Multi Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="lateFee">Late Fee (₦)</Label>
              <Input
                id="lateFee"
                name="lateFee"
                type="number"
                placeholder="0"
                value={formData.lateFee}
                onChange={handleInputChange}
                className="h-11! text-base transition-all focus-visible:ring-primary md:h-12!"
              />
            </div> */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="123 School Street, City"
                value={formData.address}
                onChange={handleInputChange}
                className={cn(
                  'h-11! text-base transition-all focus-visible:ring-primary md:h-12!',
                  errors.address && 'border-red-500 focus-visible:ring-red-500',
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                key={`country-${profile?.id}-${formData.country}`}
                value={formData.country}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    country: value,
                  }))
                  if (errors.country) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.country
                      return next
                    })
                  }
                }}
              >
                <SelectTrigger
                  className={cn(
                    'h-11! w-full text-base transition-all focus:ring-primary md:h-12!',
                    errors.country &&
                      'border-red-500 ring-red-500 focus:ring-red-500',
                  )}
                >
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
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
              <Label htmlFor="state">State</Label>
              <Select
                key={`state-${profile?.id}-${formData.state}`}
                value={formData.state}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    state: value,
                    city: '',
                  }))
                  if (errors.state) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.state
                      return next
                    })
                  }
                }}
              >
                <SelectTrigger
                  className={cn(
                    'h-11! w-full text-base transition-all focus:ring-primary md:h-12!',
                    errors.state &&
                      'border-red-500 ring-red-500 focus:ring-red-500',
                  )}
                >
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {NaijaStates.states().map((s: string) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Local Government (LGA)</Label>
              <Select
                key={`city-${profile?.id}-${formData.state}-${formData.city}`}
                value={formData.city}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, city: value }))
                  if (errors.city) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.city
                      return next
                    })
                  }
                }}
                disabled={!formData.state}
              >
                <SelectTrigger
                  className={cn(
                    'h-11! w-full text-base transition-all focus:ring-primary md:h-12!',
                    errors.city &&
                      'border-red-500 ring-red-500 focus:ring-red-500',
                  )}
                >
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent>
                  {(formData.state
                    ? NaijaStates.lgas(formData.state)?.lgas || []
                    : []
                  ).map((lga: string) => (
                    <SelectItem key={lga} value={lga}>
                      {lga}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-start gap-3 pt-6">
            <Button
              type="submit"
              disabled={isUpdating || isUploading}
              size="lg"
              className="h-12 px-10 text-base font-semibold"
            >
              {isUpdating || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isUploading ? 'Uploading & Saving...' : 'Saving...'}
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <DiscardChangesDialog onDiscard={handleDiscard}>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
              >
                Cancel
              </Button>
            </DiscardChangesDialog>
          </div>
        </form>
      </div>
    </div>
  )
}

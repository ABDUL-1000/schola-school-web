import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOnboardingStore } from '@/hooks/stores/onboarding.store'
import { useUpdateProfileMutation, useCheckSlugAvailabilityMutation, useGenerateSlugMutation } from '@/hooks/queries/profile.queries'
import { toast } from '@/lib/toast'
import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/api'
import { RefreshCw } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/onboarding/profile')({
  component: ProfileStep,
})

function ProfileStep() {
  const navigate = useNavigate()
  const { formData, updateFormData, setStep } = useOnboardingStore()
  const { user } = useAuthStore()
  const { mutateAsync: updateProfile, isPending } = useUpdateProfileMutation()
  const { mutateAsync: checkSlug } = useCheckSlugAvailabilityMutation()
  const { mutateAsync: generateSlug, isPending: isGeneratingSlug } = useGenerateSlugMutation()
  
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  useEffect(() => {
    setStep(1)
    if ((user as any)?.schoolName && !formData.schoolName) {
      updateFormData({ schoolName: (user as any).schoolName })
    }
  }, [setStep, user, formData.schoolName, updateFormData])

  // Debounced slug check
  useEffect(() => {
    if (!formData.slug) {
      setSlugStatus('idle')
      return
    }

    const timer = setTimeout(async () => {
      setSlugStatus('checking')
      try {
        const result = await checkSlug(formData.slug!)
        setSlugStatus(result.available ? 'available' : 'taken')
      } catch (error) {
        setSlugStatus('taken')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.slug, checkSlug])

  const handleGenerateSlug = async () => {
    try {
      const nameToUse = formData.schoolName || (user as any)?.schoolName || 'school'
      const result = await generateSlug(nameToUse)
      updateFormData({ slug: result.slug })
      setErrors((p) => ({ ...p, slug: false }))
      setSlugStatus('available')
    } catch (error) {
      toast.error('Failed to generate slug')
    }
  }

  const validate = () => {
    const newErrors: Record<string, boolean> = {}
    if (!formData.schoolName) newErrors.schoolName = true
    if (!formData.schoolCategory || formData.schoolCategory.length === 0) newErrors.schoolCategory = true
    if (!formData.curriculumType) newErrors.curriculumType = true
    if (!formData.slug) newErrors.slug = true
    if (!formData.schoolType) newErrors.schoolType = true

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill all required fields')
      return false
    }
    if (slugStatus === 'taken') {
      toast.error('Please choose a unique slug')
      return false
    }
    return true
  }

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const promise = updateProfile({
        schoolName: formData.schoolName,
        schoolCategory: formData.schoolCategory,
        curriculumType: formData.curriculumType,
        slug: formData.slug,
        schoolType: formData.schoolType,
      })

      toast.promise(promise, {
        loading: 'Saving profile...',
        success: 'Profile saved!',
        error: 'Failed to save profile',
      })

      await promise
      navigate({ to: '/onboarding/branch' })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="space-y-3">
        <Label>School Category</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-2">Select all that apply to your school.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['NURSERY', 'PRIMARY', 'SECONDARY'].map((category) => {
            const isSelected = formData.schoolCategory?.includes(category as any)
            return (
              <label
                key={category}
                className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    const current = formData.schoolCategory || []
                    if (checked) {
                      updateFormData({ schoolCategory: [...current, category as any] })
                    } else {
                      updateFormData({ schoolCategory: current.filter(c => c !== category) })
                    }
                    setErrors((p) => ({ ...p, schoolCategory: false }))
                  }}
                />
                <span className="text-sm font-medium leading-none">{category}</span>
              </label>
            )
          })}
        </div>
        {errors.schoolCategory && <p className="text-sm text-red-500">Please select at least one category</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="curriculumType">Curriculum Type</Label>
        <Select
          value={formData.curriculumType || ''}
          onValueChange={(val: any) => {
            updateFormData({ curriculumType: val })
            setErrors((p) => ({ ...p, curriculumType: false }))
          }}
        >
          <SelectTrigger className={cn('h-11 md:h-12 w-full', errors.curriculumType && 'border-red-500')}>
            <SelectValue placeholder="Select Curriculum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NIGERIAN">Nigerian</SelectItem>
            <SelectItem value="BRITISH">British</SelectItem>
            <SelectItem value="AMERICAN">American</SelectItem>
            <SelectItem value="MIXED">Mixed (Nigerian + British/American)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolType">School Branch Layout</Label>
        <Select
          value={formData.schoolType}
          onValueChange={(val: any) => {
            updateFormData({ schoolType: val })
          }}
        >
          <SelectTrigger className="h-11 md:h-12 w-full">
            <SelectValue placeholder="Select Layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SINGLE_BRANCH">Single Branch (One Location)</SelectItem>
            <SelectItem value="MULTI_BRANCH">Multi-Branch (Multiple Locations)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolName">School Name</Label>
        <Input
          id="schoolName"
          placeholder="Enter school name"
          value={formData.schoolName || ''}
          onChange={(e) => {
            updateFormData({ schoolName: e.target.value })
            setErrors((p) => ({ ...p, schoolName: false }))
          }}
          className={cn('h-11 md:h-12', errors.schoolName && 'border-red-500')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Unique School Slug</Label>
        <div className="flex gap-2 relative items-start">
          <div className="relative flex-1">
            <Input
              id="slug"
              placeholder="e.g global-academy"
              value={formData.slug || ''}
              onChange={(e) => {
                updateFormData({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
                setErrors((p) => ({ ...p, slug: false }))
              }}
              className={cn('h-11 md:h-12', errors.slug && 'border-red-500')}
            />
            <div className="absolute right-3 top-3 text-sm">
              {slugStatus === 'checking' && <span className="text-muted-foreground">Checking...</span>}
              {slugStatus === 'available' && <span className="text-green-500">Available ✓</span>}
              {slugStatus === 'taken' && <span className="text-red-500">Taken ✗</span>}
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGenerateSlug}
            disabled={isGeneratingSlug}
            className="h-11 md:h-12 gap-2 whitespace-nowrap px-4"
          >
            <RefreshCw className={cn("w-4 h-4", isGeneratingSlug && "animate-spin")} />
            <span className="hidden sm:inline">Auto-generate</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">This will be used for your unique portal link: <span className="font-semibold text-primary">{formData.slug || 'slug'}.schola.com</span></p>
      </div>

      <Button type="submit" className="w-full h-11 md:h-12" disabled={isPending || slugStatus === 'checking' || slugStatus === 'taken'}>
        {isPending ? 'Saving...' : 'Next Step'}
      </Button>
    </form>
  )
}


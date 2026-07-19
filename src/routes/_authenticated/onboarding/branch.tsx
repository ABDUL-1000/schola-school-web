import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOnboardingStore } from '@/hooks/stores/onboarding.store'
import { useSetupBranchesMutation } from '@/hooks/queries/onboarding.queries'
import { toast } from '@/lib/toast'
import React, { useEffect } from 'react'
import NaijaStates from 'naija-state-local-government'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/onboarding/branch')({
  component: BranchStep,
})

function BranchStep() {
  const navigate = useNavigate()
  const { formData, updateFormData, setStep } = useOnboardingStore()
  const { mutateAsync: setupBranches, isPending } = useSetupBranchesMutation()

  useEffect(() => {
    setStep(2)
    // Initialize with one branch if empty
    if (formData.branches.length === 0) {
      updateFormData({
        branches: [{ name: 'Main Campus', isHQ: true, address: '', state: '', city: '', phone: '' }],
      })
    }
  }, [setStep, formData.branches.length, updateFormData])

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    const hasEmpty = formData.branches.some(b => !b.name || !b.state || !b.city || !b.address)
    if (hasEmpty) {
      toast.error('Please fill all required branch fields')
      return
    }

    try {
      const promise = setupBranches({ branches: formData.branches })
      toast.promise(promise, {
        loading: 'Configuring branches...',
        success: 'Branches configured!',
        error: 'Failed to configure branches',
      })

      await promise
      navigate({ to: '/onboarding/academic' })
    } catch (error) {
      console.error(error)
    }
  }

  const addBranch = () => {
    updateFormData({
      branches: [...formData.branches, { name: '', isHQ: false, address: '', state: '', city: '', phone: '' }],
    })
  }

  const removeBranch = (index: number) => {
    const newBranches = [...formData.branches]
    if (newBranches[index].isHQ && newBranches.length > 1) {
      // Re-assign HQ if removing HQ
      const nextIndex = index === 0 ? 1 : 0
      newBranches[nextIndex].isHQ = true
    }
    newBranches.splice(index, 1)
    updateFormData({ branches: newBranches })
  }

  const updateBranchFields = (index: number, fields: Record<string, any>) => {
    const newBranches = [...formData.branches]
    newBranches[index] = { ...newBranches[index], ...fields }
    updateFormData({ branches: newBranches })
  }

  const updateBranch = (index: number, field: string, value: any) => {
    updateBranchFields(index, { [field]: value })
  }

  return (
    <form onSubmit={handleNext} className="space-y-6">
      {formData.schoolType === 'SINGLE_BRANCH' ? (
        <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100 text-sm text-blue-800">
          You selected Single Branch. We will automatically configure your Main Campus using your registration details. Just click Next.
        </div>
      ) : (
        <div className="space-y-6">
          {formData.branches.map((branch, index) => (
            <div key={index} className="p-4 border rounded-md relative space-y-4 bg-card">
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-red-500 hover:bg-red-50"
                  onClick={() => removeBranch(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>Branch Name {branch.isHQ && '(HQ)'}</Label>
                  <Input
                    placeholder="e.g Annex Campus"
                    value={branch.name}
                    onChange={(e) => updateBranch(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>Phone (Optional)</Label>
                  <Input
                    placeholder="+234..."
                    value={branch.phone}
                    onChange={(e) => updateBranch(index, 'phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address</Label>
                  <Input
                    placeholder="123 School Street"
                    value={branch.address}
                    onChange={(e) => updateBranch(index, 'address', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>State</Label>
                  <Select
                    value={branch.state}
                    onValueChange={(val) => {
                      updateBranchFields(index, { state: val, city: '' })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {NaijaStates.states().map((s: string) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label>Local Government</Label>
                  <Select
                    value={branch.city}
                    onValueChange={(val) => updateBranch(index, 'city', val)}
                    disabled={!branch.state}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select LGA" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {((branch.state ? NaijaStates.lgas(branch.state)?.lgas : []) || []).map((lga: string) => (
                        <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addBranch} className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" /> Add Another Branch
          </Button>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" className="flex-1 h-11 md:h-12" onClick={() => navigate({ to: '/onboarding/profile' })}>
          Back
        </Button>
        <Button type="submit" className="flex-1 h-11 md:h-12" disabled={isPending}>
          {isPending ? 'Saving...' : 'Next Step'}
        </Button>
      </div>
    </form>
  )
}

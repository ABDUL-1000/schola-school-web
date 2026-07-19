import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingData {
  schoolName?: string
  schoolCategory?: Array<('NURSERY' | 'PRIMARY' | 'SECONDARY' | 'COMBINED')>
  curriculumType?: 'NIGERIAN' | 'BRITISH' | 'AMERICAN' | 'MIXED'
  slug?: string
  logo?: string
  schoolType?: 'SINGLE_BRANCH' | 'MULTI_BRANCH'
  branches: Array<{ name: string; address?: string; city?: string; state?: string; isHQ: boolean; phone?: string }>
  sessionName: string
  sessionStartDate: string
  sessionEndDate: string
  terms: Array<{ name: string; startDate: string; endDate: string }>
  classes: Array<{ name: string; level: string; sortOrder: number }>
}

interface OnboardingState {
  step: number
  formData: OnboardingData
  setStep: (step: number) => void
  updateFormData: (data: Partial<OnboardingData>) => void
  resetOnboarding: () => void
}

const initialData: OnboardingData = {
  schoolCategory: undefined,
  curriculumType: undefined,
  slug: '',
  logo: '',
  schoolType: 'SINGLE_BRANCH',
  branches: [],
  sessionName: '',
  sessionStartDate: '',
  sessionEndDate: '',
  terms: [],
  classes: [],
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 1,
      formData: initialData,
      setStep: (step) => set({ step }),
      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
      resetOnboarding: () => set({ step: 1, formData: initialData }),
    }),
    {
      name: 'edu-onboarding-storage',
    },
  ),
)

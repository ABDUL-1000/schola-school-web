import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface RegistrationState {
  step: number
  formData: {
    email: string
    firstName: string
    otp: string
    schoolName: string
    phone: string
    password: string
    schoolType: string
    address: string
    city: string
    state: string
    country: string
    confirmPassword: string
  }
  verificationToken: string
}

interface RegistrationActions {
  setStep: (step: number) => void
  updateFormData: (data: Partial<RegistrationState['formData']>) => void
  setVerificationToken: (token: string) => void
  resetRegistration: () => void
}

type RegistrationStore = RegistrationState & RegistrationActions

const initialState: RegistrationState = {
  step: 1,
  formData: {
    email: '',
    firstName: '',
    otp: '',
    schoolName: '',
    phone: '',
    password: '',
    schoolType: 'SINGLE_BRANCH',
    address: '',
    city: '',
    state: '',
    country: '',
    confirmPassword: '',
  },
  verificationToken: '',
}

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      setVerificationToken: (verificationToken) => set({ verificationToken }),

      resetRegistration: () => set(initialState),
    }),
    {
      name: 'edu-registration-storage',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage so progress is kept during tab life but cleared on close if desired, or localStorage for long term. The user said "refresh", so sessionStorage is enough, but localStorage is safer.
    },
  ),
)

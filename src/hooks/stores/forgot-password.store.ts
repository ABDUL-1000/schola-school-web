import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ForgotPasswordState {
  step: number
  formData: {
    email: string
    otp: string
    password: string
    confirmPassword: string
  }
  resetToken: string
}

interface ForgotPasswordActions {
  setStep: (step: number) => void
  updateFormData: (data: Partial<ForgotPasswordState['formData']>) => void
  setResetToken: (token: string) => void
  resetForgotPassword: () => void
}

type ForgotPasswordStore = ForgotPasswordState & ForgotPasswordActions

const initialState: ForgotPasswordState = {
  step: 1,
  formData: {
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  },
  resetToken: '',
}

export const useForgotPasswordStore = create<ForgotPasswordStore>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      setResetToken: (resetToken) => set({ resetToken }),

      resetForgotPassword: () => set(initialState),
    }),
    {
      name: 'edu-forgot-password-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

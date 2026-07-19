import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { RegistrationState } from '@/types'

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      email: null,
      verificationToken: null,

      setEmail: (email: string | null) => set({ email }),
      setVerificationToken: (token: string | null) =>
        set({ verificationToken: token }),
      reset: () => set({ email: null, verificationToken: null }),
    }),
    {
      name: 'edu-registration-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)


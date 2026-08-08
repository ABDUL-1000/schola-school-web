import { create } from 'zustand'

export interface SchoolData {
  id: string
  schoolName: string
  slug: string
  logo: string | null
}

interface SchoolStore {
  school: SchoolData | null
  setSchool: (school: SchoolData) => void
  clearSchool: () => void
}

export const useSchoolStore = create<SchoolStore>((set) => ({
  school: null,
  setSchool: (school) => set({ school }),
  clearSchool: () => set({ school: null }),
}))

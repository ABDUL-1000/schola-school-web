import { useAuthStore } from '@/api'

export const useAuth = () => {
  const store = useAuthStore()

  return {
    isAuthenticated: store.isAuthenticated,
    user: store.user,
    token: store.token,
    hasRole: store.hasRole,
    isStudent: store.isStudent,
    isTeacher: store.isTeacher,
    isSchool: store.isSchool,
    login: store.login,
    logout: store.logout,
  }
}


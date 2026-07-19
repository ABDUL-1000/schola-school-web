import { api } from '../../lib/api'
import type {
  ApiResponse,
  LoginCredentials,
  LoginResponse,
  AuthTokens,
} from '@/types'

export const authApi = {
  requestOtp: async (data: { email: string; firstName: string }) => {
    const response = await api.post<ApiResponse<any>>(
      '/school/auth/request-otp',
      data,
    )
    return response.data
  },

  verifyOtp: async (data: { email: string; code: string }) => {
    const response = await api.post<ApiResponse<LoginResponse>>(
      '/school/auth/verify-otp',
      data,
    )
    return response.data.data
  },

  register: async (data: any, verificationToken: string) => {
    const response = await api.post<ApiResponse<any>>(
      '/school/auth/register',
      data,
      {
        headers: {
          'x-verification-token': verificationToken,
        },
      },
    )
    return response.data.data
  },

  login: async (credentials: LoginCredentials) => {
    const response = await api.post<ApiResponse<LoginResponse>>(
      '/school/auth/login',
      credentials,
    )
    return response.data.data
  },

  refreshToken: async (token: string) => {
    const response = await api.post<ApiResponse<AuthTokens>>(
      '/school/auth/refresh-token',
      { token },
    )
    return response.data.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse<any>>(
      '/school/auth/forgot-password',
      { email },
    )
    return response.data
  },

  verifyResetOtp: async (data: { email: string; code: string }) => {
    const response = await api.post<ApiResponse<{ resetToken: string }>>(
      '/school/auth/verify-reset-otp',
      data,
    )
    return response.data.data
  },

  resetPassword: async (data: any) => {
    const response = await api.post<ApiResponse<any>>(
      '/school/auth/reset-password',
      data,
    )
    return response.data
  },

  changePassword: async (data: any) => {
    const response = await api.post<ApiResponse<any>>(
      '/school/auth/change-password',
      data,
    )
    return response.data
  },

  logout: async () => {
    const response = await api.post<ApiResponse<any>>('/school/auth/logout')
    return response.data
  },

  resolveSlug: async (slug: string) => {
    const response = await api.get<ApiResponse<{ schoolName: string; logo: string | null; slug: string; id: string }>>(
      `/school/auth/resolve/${slug}`
    )
    return response.data.data
  },
}


import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { IndustryType, Plan } from './constants'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: '/api/org',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

const AUTH_FREE_PATHS = ['/login', '/signup', '/verifyOtp', '/forgot-password', '/reset-password', '/refresh-token']

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

let isRefreshing = false
let pendingRequests: Array<() => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableRequestConfig | undefined
    const isAuthFree = AUTH_FREE_PATHS.some((path) => config?.url?.includes(path))

    if (error.response?.status !== 401 || !config || config._retried || isAuthFree) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push(() => {
          config._retried = true
          api(config).then(resolve, reject)
        })
      })
    }

    config._retried = true
    isRefreshing = true
    try {
      await api.post('/refresh-token')
      pendingRequests.forEach((run) => run())
      pendingRequests = []
      return api(config)
    } catch (refreshError) {
      pendingRequests = []
      useAuthStore.getState().clearAuth()
      window.location.assign('/login')
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export function refreshAccessToken() {
  return api.post('/refresh-token')
}

export function logoutRequest() {
  return api.post('/org-logout')
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    const message = data?.message || data?.data?.message || data?.error
    if (message) return message
    if (error.response?.status === 401) return 'Invalid credentials.'
    if (!error.response) return 'Could not reach the server. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

export interface SignupPayload {
  companyName: string
  ownerName: string
  industryType: IndustryType
  country: string
  email: string
  password: string
}

export interface SignupResponse {
  status: string
  data: {
    organizationId: string
    userId: string
    message: string
  }
}

export function signup(payload: SignupPayload) {
  return api.post<SignupResponse>('/signup', payload).then((res) => res.data)
}

export interface VerifyOtpPayload {
  email: string
  otp: string
}

export interface VerifyOtpResponse {
  status: string
  data: { message: string }
}

export function verifyOtp(payload: VerifyOtpPayload) {
  return api.post<VerifyOtpResponse>('/verifyOtp', payload).then((res) => res.data)
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  status: string
  message: string
  data: {
    organizationId: string
    userId: string
    name: string
    email: string
    role: string
    status: string
    isEmailVerified: boolean
    plan: Plan
    companyName: string
    token: { accessToken: string; refreshToken: string }
  }
}

export function login(payload: LoginPayload) {
  return api.post<LoginResponse>('/login', payload).then((res) => res.data)
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
  data: { otpSent: boolean; email: string; remainingTime: number }
}

export function forgotPassword(email: string) {
  return api.post<ForgotPasswordResponse>('/forgot-password', { email }).then((res) => res.data)
}

export interface ResetPasswordPayload {
  email: string
  otp: string
  newPassword: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

export function resetPassword(payload: ResetPasswordPayload) {
  return api.post<ResetPasswordResponse>('/reset-password', payload).then((res) => res.data)
}

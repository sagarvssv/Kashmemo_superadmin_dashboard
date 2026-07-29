import axios from 'axios'
import { api } from './api'

export interface Employee {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  designation: string
  role: string
  status: string
  isEmailVerified: boolean
  mustResetPassword: boolean
  source?: string | null
  departmentId?: string | null
  createdAt: string
}

export interface Profile extends Employee {
  organizationId: string
}

export function getProfile() {
  return api.get<{ status: string; data: Profile }>('/profile').then((res) => res.data)
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ListEmployeesParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  designation?: string
  role?: string
}

export function listEmployees(params: ListEmployeesParams = {}) {
  return api
    .get<{ status: string; data: Employee[]; pagination: Pagination }>('/list-employees', { params })
    .then((res) => res.data)
}

export interface AddManualEmployeePayload {
  name: string
  email: string
  phoneNumber?: string
  designation: string
  department: string
}

export function addManualEmployee(payload: AddManualEmployeePayload) {
  return api
    .post<{ status: string; data: Employee }>('/add-employee-manual', payload)
    .then((res) => res.data)
}

export interface UploadCsvResult {
  insertedCount: number
  employees: Employee[]
}

export function uploadEmployeeCsv(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return api
    .post<{ status: string; data: UploadCsvResult }>('/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}

export async function downloadCsvTemplate() {
  const res = await api.get('/csv-template-download', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'employee-upload-template.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function deleteEmployee(employeeId: string) {
  return api
    .delete<{ status: string; data: { message: string } }>(`/delete-employee/${employeeId}`)
    .then((res) => res.data)
}

export const ASSIGNABLE_ROLES = ['MANAGER', 'HR', 'EMPLOYEE'] as const
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export function changeEmployeeRole(employeeId: string, role: AssignableRole) {
  return api
    .patch<{ status: string; data: Employee }>(`/change-employee-role/${employeeId}`, { role })
    .then((res) => res.data)
}

export interface EmployeeDetails {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  designation: string | null
  role: string
  department: { name: string } | null
  organization: { companyName: string }
}

export function getEmployeeDetails(employeeId: string) {
  return api.get<{ status: string; data: EmployeeDetails }>(`/get-employee/${employeeId}`).then((res) => res.data)
}

export interface CsvRowError {
  row: number
  email?: string
  reason: string
}

export function extractCsvRowErrors(error: unknown): CsvRowError[] | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    const errors = data?.errors ?? data?.data?.errors
    if (Array.isArray(errors)) return errors
  }
  return null
}

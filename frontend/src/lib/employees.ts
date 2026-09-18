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
  department: { id: string; name: string } | null
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
  departmentId?: string
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

// Excel's "CSV UTF-8" export prepends a byte-order-mark to the file, which
// glues itself to the first header cell (e.g. "name" becomes "﻿name").
// The backend's CSV parser doesn't strip it, so that column silently reads
// as empty for every row. Stripping it here means the upload works
// regardless of which CSV variant the file was saved as.
async function stripUtf8Bom(file: File): Promise<File> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
  if (!hasBom) return file
  return new File([bytes.slice(3)], file.name, { type: file.type })
}

export async function uploadEmployeeCsv(file: File) {
  const cleanFile = await stripUtf8Bom(file)
  const formData = new FormData()
  formData.append('file', cleanFile)
  // The shared `api` instance defaults Content-Type to application/json —
  // for a FormData body that makes axios JSON.stringify the form instead of
  // sending it as multipart (see axios's transformRequest: it only leaves
  // FormData untouched when it does NOT see a JSON content type). Clearing
  // it here (not omitting the option — that would leave the json default in
  // place) lets the browser compute the correct multipart boundary itself.
  const res = await api.post<{ status: string; data: UploadCsvResult }>('/upload-csv', formData, {
    headers: { 'Content-Type': undefined },
  })
  return res.data
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

export const ASSIGNABLE_ROLES = ['MANAGER', 'HR', 'FINANCE_MANAGER', 'EMPLOYEE'] as const
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

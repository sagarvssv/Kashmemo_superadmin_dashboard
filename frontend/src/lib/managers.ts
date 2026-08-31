import { api } from './api'

export interface ManagerDepartment {
  id: string
  organizationId: string
  name: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isPrimary: boolean
  // Not confirmed present on the list response yet — the CEO-only
  // set-limit endpoint exists, but listManagerDepartments hasn't been
  // checked to see if it echoes the current limit back. Treat as
  // possibly absent until confirmed.
  approvalLimit?: number | null
}

export function listManagerDepartments(managerId: string) {
  return api
    .get<{ status: string; data: ManagerDepartment[] }>(`/managers/${managerId}/departments`)
    .then((res) => res.data)
}

export function setManagerPrimaryDepartment(managerId: string, departmentId: string) {
  return api
    .patch<{ status: string; data: unknown }>(`/managers/${managerId}/primary-department`, { departmentId })
    .then((res) => res.data)
}

export function assignManagerToDepartment(managerId: string, departmentId: string) {
  return api
    .post<{ status: string; data: unknown }>('/managers/assign-department', { managerId, departmentId })
    .then((res) => res.data)
}

export function unassignManagerFromDepartment(managerId: string, departmentId: string) {
  return api
    .delete<{ status: string; message: string }>(`/managers/${managerId}/departments`, { data: { departmentId } })
    .then((res) => res.data)
}

export function setManagerApprovalLimit(managerId: string, departmentId: string, limit: number) {
  return api
    .patch<{ status: string; data: { approvalLimit: number } }>(`/managers/${managerId}/departments/${departmentId}`, {
      limit,
    })
    .then((res) => res.data)
}

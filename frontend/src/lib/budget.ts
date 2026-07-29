import { api } from './api'

export interface AllocateBudgetPayload {
  departmentId: string
  amount: number
  month: number
  year: number
}

export interface Budget {
  id: string
  organizationId: string
  departmentId: string
  amount: number | string
  month: number
  year: number
  allocatedBy: string
}

export function allocateBudget(payload: AllocateBudgetPayload) {
  return api.post<{ status: string; data: Budget }>('/budget/allocate-budget', payload).then((res) => res.data)
}

export interface DepartmentBudget {
  amount: number | string
  department: { name: string }
}

export function getDepartmentBudget(departmentId: string, month: number, year: number) {
  return api
    .get<{ status: string; data: DepartmentBudget | null }>(`/budget/get-department-budget/${departmentId}`, {
      params: { month, year },
    })
    .then((res) => res.data)
}

export interface OrganizationBudgetRow {
  id: string
  amount: number | string
  month: number
  year: number
  department: { id: string; name: string }
}

export function getOrganizationBudget(month: number, year: number) {
  return api
    .get<{ status: string; data: OrganizationBudgetRow[] }>('/budget/get-organization-budget', {
      params: { month, year },
    })
    .then((res) => res.data)
}

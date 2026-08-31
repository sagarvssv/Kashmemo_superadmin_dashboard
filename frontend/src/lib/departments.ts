import { api } from './api'

export interface DepartmentOption {
  id: string
  name: string
}

export function listDepartments() {
  return api.get<{ status: string; data: DepartmentOption[] }>('/get-departmentList').then((res) => res.data)
}

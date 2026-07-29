import { getEmployeeDetails, listEmployees } from './employees'

export interface DepartmentOption {
  id: string
  name: string
}

/**
 * There is no GET /departments endpoint yet, so this derives the department
 * list from existing employees: one lookup per distinct departmentId (via
 * GET /get-employee/:id, the only endpoint that resolves a department name).
 * Departments with zero employees are invisible until a real endpoint exists.
 * Swap this out for a direct API call once one is added.
 */
export async function listDepartmentsFromEmployees(): Promise<DepartmentOption[]> {
  const { data: employees } = await listEmployees({ limit: 1000 })

  const distinctDepartmentIds = Array.from(
    new Set(employees.map((e) => e.departmentId).filter((id): id is string => !!id)),
  )

  const departments = await Promise.all(
    distinctDepartmentIds.map(async (departmentId) => {
      const representative = employees.find((e) => e.departmentId === departmentId)!
      const { data } = await getEmployeeDetails(representative.id)
      return { id: departmentId, name: data.department?.name ?? 'Unknown department' }
    }),
  )

  return departments.sort((a, b) => a.name.localeCompare(b.name))
}

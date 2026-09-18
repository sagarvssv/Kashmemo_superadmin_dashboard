import { api } from './api'
import type { Ticket } from './tickets'

export interface DepartmentBudgetSummary {
  departmentId: { id: string; name: string }
  month: number
  year: number
  totalAllocated: number
  spent: number
  remaining: number
  hasBudgetSet: boolean
}

export interface DashboardSummary {
  month: number
  year: number
  totalEmployees: number
  totalDepartments: number
  budget: {
    totalAllocatedBudget: number
    totalSpent: number
    totalRemaining: number
  }
  tickets: {
    PENDING: number
    PARTIALLY_APPROVED?: number
    APPROVED: number
    DISBURSED: number
    REJECTED: number
  }
  departments: DepartmentBudgetSummary[]
}

export function getDashboardSummary(month: number, year: number) {
  return api
    .get<{ status: string; data: DashboardSummary }>('/dashboard/summary', { params: { month, year } })
    .then((res) => res.data)
}

export function getCeoPendingTickets() {
  return api.get<{ status: string; data: Ticket[] }>('/dashboard/pending-tickets').then((res) => res.data)
}

export interface DisbursedDepartmentSummary {
  departmentName: string
  totalAmount: number
  ticketCount: number
}

export interface DisbursedTicketsSummary {
  totalDisbursedAmount: number
  departmentSummary: Record<string, DisbursedDepartmentSummary>
}

// Lives on the separate dashboard router mounted at /api/dashboard (shared
// across CEO/FINANCE_MANAGER), not under the /api/org baseURL like the rest
// of this file — override it per-request, same pattern as approveTicket.
export function getDisbursedTicketsSummary(month: number, year: number) {
  return api
    .get<{ status: string; data: DisbursedTicketsSummary }>('/disbursed-tickets-summary', {
      baseURL: '/api/dashboard',
      params: { month, year },
    })
    .then((res) => res.data)
}

export interface DailyTicketStatusBreakdown {
  PENDING: number
  PARTIALLY_APPROVED: number
  APPROVED: number
  REJECTED: number
  DISBURSED: number
}

export interface DailyTicketReportEntry {
  day: string
  count: DailyTicketStatusBreakdown
  amount: DailyTicketStatusBreakdown
  totalCount: number
  totalAmount: number
}

export interface DailyTicketReport {
  summary: DailyTicketReportEntry[]
}

// Also on the /api/dashboard router — see getDisbursedTicketsSummary above.
// Backend expects lowercase, unhyphenated query keys (`startdate`/`enddate`),
// each a plain YYYY-MM-DD date string.
export function getDailyTicketReport(startDate: string, endDate: string) {
  return api
    .get<{ status: string; data: DailyTicketReport }>('/daily-ticket-report', {
      baseURL: '/api/dashboard',
      params: { startdate: startDate, enddate: endDate },
    })
    .then((res) => res.data)
}

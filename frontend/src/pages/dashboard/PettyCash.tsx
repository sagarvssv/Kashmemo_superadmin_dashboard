import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, Loader2, Pencil, PiggyBank, Plus, Wallet } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { extractErrorMessage } from '../../lib/api'
import { formatCurrency, MONTH_NAMES } from '../../lib/format'
import { listDepartmentsFromEmployees, type DepartmentOption } from '../../lib/departments'
import { allocateBudget, getOrganizationBudget, type OrganizationBudgetRow } from '../../lib/budget'
import { connectSocket } from '../../lib/socket'
import { useCurrencyStore } from '../../store/currencyStore'

const now = new Date()
const YEAR_OPTIONS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2]

interface FormState {
  departmentId: string
  amount: string
  month: number
  year: number
}

export default function PettyCash() {
  const currencyCode = useCurrencyStore((state) => state.currencyCode)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [budgetRows, setBudgetRows] = useState<OrganizationBudgetRow[]>([])
  const [budgetLoading, setBudgetLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [lockDepartment, setLockDepartment] = useState(false)
  const [form, setForm] = useState<FormState>({ departmentId: '', amount: '', month, year })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listDepartmentsFromEmployees()
      .then(setDepartments)
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setDepartmentsLoading(false))
  }, [])

  const fetchBudget = () => {
    setBudgetLoading(true)
    getOrganizationBudget(month, year)
      .then((res) => setBudgetRows(res.data))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setBudgetLoading(false))
  }

  useEffect(() => {
    fetchBudget()
  }, [month, year])

  const fetchBudgetRef = useRef(fetchBudget)
  fetchBudgetRef.current = fetchBudget

  useEffect(() => {
    const socket = connectSocket()
    const handleBudgetUpdate = () => fetchBudgetRef.current()
    socket.on('budget:update', handleBudgetUpdate)
    return () => {
      socket.off('budget:update', handleBudgetUpdate)
    }
  }, [])

  const rows = departments.map((dept) => {
    const budget = budgetRows.find((b) => b.department.id === dept.id)
    return { department: dept, amount: budget?.amount ?? null }
  })

  const totalAllocated = budgetRows.reduce((sum, b) => sum + Number(b.amount), 0)
  const fundedCount = budgetRows.length

  const openAllocate = (dept?: DepartmentOption, existingAmount?: number | string) => {
    setLockDepartment(!!dept)
    setForm({
      departmentId: dept?.id ?? '',
      amount: existingAmount != null ? String(existingAmount) : '',
      month,
      year,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFormErrors((e) => ({ ...e, [key]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Partial<Record<keyof FormState, string>> = {}
    if (!form.departmentId) errors.departmentId = 'Select a department.'
    const amountValue = Number(form.amount)
    if (!form.amount || Number.isNaN(amountValue) || amountValue < 1) {
      errors.amount = `Enter an amount of at least ${currencyCode} 1.`
    }
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      await allocateBudget({
        departmentId: form.departmentId,
        amount: amountValue,
        month: form.month,
        year: form.year,
      })
      toast.success('Budget allocated.')
      setModalOpen(false)
      if (form.month === month && form.year === year) fetchBudget()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const loading = departmentsLoading || budgetLoading

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Petty Cash</h1>
          <p className="mt-1 text-[15px] text-ink-500">Allocate and track monthly budgets by department.</p>
        </div>
        <Button onClick={() => openAllocate()} disabled={departments.length === 0}>
          <Plus className="size-4" />
          Allocate budget
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="flex items-center gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold tabular-nums text-ink-900">
              {formatCurrency(totalAllocated, currencyCode)}
            </p>
            <p className="mt-0.5 text-sm text-ink-500">
              Total allocated · {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <Building2 className="size-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold tabular-nums text-ink-900">
              {fundedCount}/{departments.length}
            </p>
            <p className="mt-0.5 text-sm text-ink-500">Departments funded this month</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="max-w-[160px]">
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="max-w-[120px]">
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-20 text-ink-400">
            <Loader2 className="size-5 animate-spin" />
            Loading budgets…
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <PiggyBank className="size-6" />
            </span>
            <h2 className="font-display text-lg font-bold text-ink-900">No departments yet</h2>
            <p className="max-w-sm text-[15px] text-ink-500">
              Add employees with a department from the Team page to start allocating petty cash budgets.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-6 py-3 font-semibold">Department</th>
                <th className="px-6 py-3 font-semibold">Allocated amount</th>
                <th className="px-6 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ department, amount }) => (
                <tr key={department.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-6 py-3.5 text-sm font-medium text-ink-800">{department.name}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold tabular-nums text-ink-800">
                    {amount != null ? (
                      formatCurrency(amount, currencyCode)
                    ) : (
                      <span className="font-normal text-ink-400">Not allocated</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Button
                      variant="secondary"
                      onClick={() => openAllocate(department, amount ?? undefined)}
                      className="!px-3 !py-1.5 text-sm"
                    >
                      <Pencil className="size-3.5" />
                      {amount != null ? 'Edit' : 'Allocate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={lockDepartment ? 'Edit budget' : 'Allocate budget'}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Field label="Department" htmlFor="budget-department" error={formErrors.departmentId}>
            <Select
              id="budget-department"
              value={form.departmentId}
              disabled={lockDepartment}
              onChange={(e) => updateForm('departmentId', e.target.value)}
              hasError={!!formErrors.departmentId}
            >
              <option value="" disabled>
                Select department
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={`Amount (${currencyCode})`} htmlFor="budget-amount" error={formErrors.amount}>
            <Input
              id="budget-amount"
              type="number"
              min={1}
              value={form.amount}
              onChange={(e) => updateForm('amount', e.target.value)}
              hasError={!!formErrors.amount}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Month" htmlFor="budget-month">
              <Select
                id="budget-month"
                value={form.month}
                onChange={(e) => updateForm('month', Number(e.target.value))}
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Year" htmlFor="budget-year">
              <Select
                id="budget-year"
                value={form.year}
                onChange={(e) => updateForm('year', Number(e.target.value))}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

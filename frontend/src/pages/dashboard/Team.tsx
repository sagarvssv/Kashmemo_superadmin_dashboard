import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { extractErrorMessage } from '../../lib/api'
import {
  addManualEmployee,
  deleteEmployee,
  downloadCsvTemplate,
  extractCsvRowErrors,
  listEmployees,
  uploadEmployeeCsv,
  type CsvRowError,
  type Employee,
  type Pagination,
} from '../../lib/employees'

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-[#e6f6e6] text-[#0ca30c]',
  INACTIVE: 'bg-ink-100 text-ink-500',
  SUSPENDED: 'bg-[#fbe9e9] text-[#d03b3b]',
}

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED']
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

interface FormState {
  name: string
  email: string
  phoneNumber: string
  designation: string
  department: string
}

const emptyForm: FormState = { name: '', email: '', phoneNumber: '', designation: '', department: '' }

export default function Team() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [csvErrors, setCsvErrors] = useState<CsvRowError[] | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [designationInput, setDesignationInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const search = useDebouncedValue(searchInput, 350)
  const designation = useDebouncedValue(designationInput, 350)
  const hasActiveFilters = !!(search || designation || statusFilter)

  useEffect(() => {
    setPage(1)
  }, [search, designation, statusFilter, limit])

  const fetchEmployees = () => {
    setLoading(true)
    listEmployees({
      page,
      limit,
      search: search || undefined,
      designation: designation || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => {
        setEmployees(res.data)
        setPagination(res.pagination)
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEmployees()
  }, [page, limit, search, designation, statusFilter])

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFormErrors((e) => ({ ...e, [key]: undefined }))
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Partial<FormState> = {}
    if (!form.name.trim()) errors.name = 'Name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.'
    if (!form.designation.trim()) errors.designation = 'Designation is required.'
    if (!form.department.trim()) errors.department = 'Department is required.'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      await addManualEmployee({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        designation: form.designation.trim(),
        department: form.department.trim(),
      })
      toast.success('Employee added. Login credentials have been emailed to them.')
      setAddOpen(false)
      setForm(emptyForm)
      fetchEmployees()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCsvSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setCsvErrors(null)
    try {
      const res = await uploadEmployeeCsv(file)
      toast.success(`Added ${res.data.insertedCount} employee${res.data.insertedCount === 1 ? '' : 's'}.`)
      fetchEmployees()
    } catch (err) {
      const rowErrors = extractCsvRowErrors(err)
      if (rowErrors) {
        setCsvErrors(rowErrors)
      } else {
        toast.error(extractErrorMessage(err))
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteEmployee(deleteTarget.id)
      toast.success('Employee removed.')
      setEmployees((list) => list.filter((e) => e.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Team</h1>
          <p className="mt-1 text-[15px] text-ink-500">Manage the employees in your organization.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" onClick={() => downloadCsvTemplate()}>
            <Download className="size-4" />
            Template
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>
            <Upload className="size-4" />
            Upload CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvSelect} />
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add employee
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search by name or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          placeholder="Filter by designation"
          value={designationInput}
          onChange={(e) => setDesignationInput(e.target.value)}
          className="sm:max-w-[220px]"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:max-w-[180px]"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-20 text-ink-400">
            <Loader2 className="size-5 animate-spin" />
            Loading employees…
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <UserRound className="size-6" />
            </span>
            <h2 className="font-display text-lg font-bold text-ink-900">
              {hasActiveFilters ? 'No matching employees' : 'No employees yet'}
            </h2>
            <p className="max-w-sm text-[15px] text-ink-500">
              {hasActiveFilters
                ? 'Try a different search term or clear your filters.'
                : 'Add your first employee manually or upload a CSV to onboard your whole team at once.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-y border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Designation</th>
                  <th className="px-6 py-3 font-semibold">Phone</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Access</th>
                  <th className="px-6 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-ink-100 last:border-0">
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-medium text-ink-800">{employee.name}</p>
                      <p className="text-sm text-ink-400">{employee.email}</p>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-ink-600">{employee.designation}</td>
                    <td className="px-6 py-3.5 text-sm text-ink-600">{employee.phoneNumber ?? '—'}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusStyles[employee.status] ?? 'bg-ink-100 text-ink-500'
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {employee.mustResetPassword && (
                        <span className="inline-flex rounded-full bg-[#fef3de] px-2.5 py-1 text-xs font-semibold text-[#9c6716]">
                          Reset pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setDeleteTarget(employee)}
                        className="rounded-lg p-2 text-ink-400 hover:bg-[#fbe9e9] hover:text-[#d03b3b]"
                        aria-label={`Remove ${employee.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination && pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-ink-100 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-ink-400">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} employee
                {pagination.total === 1 ? '' : 's'}
              </p>
              <label className="flex items-center gap-2 text-sm text-ink-400">
                Rows per page
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm text-ink-700"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add employee">
        <form onSubmit={handleAddEmployee} noValidate className="flex flex-col gap-4">
          <Field label="Full name" htmlFor="emp-name" error={formErrors.name}>
            <Input
              id="emp-name"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              hasError={!!formErrors.name}
            />
          </Field>
          <Field label="Email" htmlFor="emp-email" error={formErrors.email}>
            <Input
              id="emp-email"
              type="email"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              hasError={!!formErrors.email}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Designation" htmlFor="emp-designation" error={formErrors.designation}>
              <Input
                id="emp-designation"
                placeholder="Accountant"
                value={form.designation}
                onChange={(e) => updateForm('designation', e.target.value)}
                hasError={!!formErrors.designation}
              />
            </Field>
            <Field label="Department" htmlFor="emp-department" error={formErrors.department}>
              <Input
                id="emp-department"
                placeholder="Finance"
                value={form.department}
                onChange={(e) => updateForm('department', e.target.value)}
                hasError={!!formErrors.department}
              />
            </Field>
          </div>
          <Field label="Phone number (optional)" htmlFor="emp-phone">
            <Input
              id="emp-phone"
              value={form.phoneNumber}
              onChange={(e) => updateForm('phoneNumber', e.target.value)}
            />
          </Field>
          <p className="text-sm text-ink-400">
            A temporary password will be emailed to them, and they'll be asked to reset it on first login.
          </p>
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add employee
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!csvErrors} onClose={() => setCsvErrors(null)} title="CSV validation failed">
        <p className="mb-4 text-sm text-ink-500">Fix the rows below in your CSV and upload it again.</p>
        <div className="flex flex-col gap-2">
          {csvErrors?.map((err, i) => (
            <div key={i} className="rounded-lg bg-[#fbe9e9] px-3.5 py-2.5 text-sm text-[#d03b3b]">
              {err.row >= 0 ? `Row ${err.row}` : err.email ?? 'Row'}: {err.reason}
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove employee"
        description={`Are you sure you want to remove ${deleteTarget?.name}? This can't be undone.`}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

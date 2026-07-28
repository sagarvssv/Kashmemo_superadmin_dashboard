import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { PasswordInput } from '../components/ui/PasswordInput'
import { PlanCard } from '../components/ui/PlanCard'
import { Button } from '../components/ui/Button'
import { INDUSTRY_TYPES, COUNTRIES, PLANS, type IndustryType, type Plan } from '../lib/constants'
import { signup, extractErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface FormState {
  companyName: string
  ownerName: string
  industryType: IndustryType | ''
  country: string
  email: string
  password: string
  confirmPassword: string
}

const initialState: FormState = {
  companyName: '',
  ownerName: '',
  industryType: '',
  country: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export default function Signup() {
  const navigate = useNavigate()
  const saveOrgProfile = useAuthStore((state) => state.saveOrgProfile)
  const [form, setForm] = useState<FormState>(initialState)
  const [plan, setPlan] = useState<Plan>('STARTER')
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.companyName.trim()) next.companyName = 'Company name is required.'
    if (!form.ownerName.trim()) next.ownerName = 'Owner name is required.'
    if (!form.industryType) next.industryType = 'Select an industry.'
    if (!form.country) next.country = 'Select a country.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await signup({
        companyName: form.companyName.trim(),
        ownerName: form.ownerName.trim(),
        industryType: form.industryType as IndustryType,
        country: form.country,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      saveOrgProfile(res.data.organizationId, {
        industryType: form.industryType as IndustryType,
        country: form.country,
      })
      toast.success(res.data.message || 'Signup successful. Check your email for the OTP.')
      navigate('/verify-otp', { state: { email: form.email.trim().toLowerCase() } })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your organization"
      subtitle="Set up your workspace as CEO and start tracking petty cash today."
      size="wide"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Company name" htmlFor="companyName" error={errors.companyName}>
              <Input
                id="companyName"
                placeholder="Your company name"
                value={form.companyName}
                onChange={(e) => update('companyName', e.target.value)}
                hasError={!!errors.companyName}
              />
            </Field>
            <Field label="Owner name" htmlFor="ownerName" error={errors.ownerName}>
              <Input
                id="ownerName"
                placeholder="Your name"
                value={form.ownerName}
                onChange={(e) => update('ownerName', e.target.value)}
                hasError={!!errors.ownerName}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Industry type" htmlFor="industryType" error={errors.industryType}>
              <Select
                id="industryType"
                value={form.industryType}
                onChange={(e) => update('industryType', e.target.value as IndustryType)}
                hasError={!!errors.industryType}
              >
                <option value="" disabled>
                  Select industry
                </option>
                {INDUSTRY_TYPES.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Country" htmlFor="country" error={errors.country}>
              <Select
                id="country"
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                hasError={!!errors.country}
              >
                <option value="" disabled>
                  Select country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Work email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              hasError={!!errors.email}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Password" htmlFor="password" error={errors.password}>
              <PasswordInput
                id="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                hasError={!!errors.password}
              />
            </Field>
            <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
              <PasswordInput
                id="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                hasError={!!errors.confirmPassword}
              />
            </Field>
          </div>
        </div>

        <div>
          <p className="text-center font-display text-base font-semibold text-ink-800">Choose your plan</p>
          <p className="mb-5 text-center text-sm text-ink-400">You can upgrade anytime from your dashboard.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PLANS.map((p) => (
              <PlanCard key={p.id} {...p} selected={plan === p.id} onSelect={setPlan} />
            ))}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
          <Button type="submit" fullWidth loading={submitting}>
            Create organization
          </Button>

          <p className="text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
              Log in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}

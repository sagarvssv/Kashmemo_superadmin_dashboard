import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { OtpInput } from '../components/ui/OtpInput'
import { Button } from '../components/ui/Button'
import { resetPassword, extractErrorMessage } from '../lib/api'

interface FormState {
  email: string
  otp: string
  newPassword: string
  confirmPassword: string
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const routerState = location.state as { email?: string; remainingTime?: number } | null

  const [form, setForm] = useState<FormState>({
    email: routerState?.email ?? '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [secondsLeft, setSecondsLeft] = useState(routerState?.remainingTime ?? 0)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'form', string>>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft > 0])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (form.otp.length !== 6) next.otp = 'Enter the 6-digit code.'
    if (form.newPassword.length < 8) next.newPassword = 'Password must be at least 8 characters.'
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const res = await resetPassword({
        email: form.email.trim().toLowerCase(),
        otp: form.otp,
        newPassword: form.newPassword,
      })
      toast.success(res.message || 'Password reset successfully.')
      navigate('/login')
    } catch (err) {
      setErrors({ form: extractErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter the code we sent you and choose a new password.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {errors.form && (
          <div className="rounded-xl bg-[#fbe9e9] px-4 py-3 text-sm text-[#d03b3b]">{errors.form}</div>
        )}

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            hasError={!!errors.email}
          />
        </Field>

        <Field
          label="6-digit code"
          htmlFor="otp-0"
          error={errors.otp}
          hint={secondsLeft > 0 ? `Code expires in ${minutes}:${seconds.toString().padStart(2, '0')}` : undefined}
        >
          <OtpInput value={form.otp} onChange={(v) => update('otp', v)} hasError={!!errors.otp} />
        </Field>

        <Field label="New password" htmlFor="newPassword" error={errors.newPassword}>
          <PasswordInput
            id="newPassword"
            placeholder="At least 8 characters"
            value={form.newPassword}
            onChange={(e) => update('newPassword', e.target.value)}
            hasError={!!errors.newPassword}
          />
        </Field>

        <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
          <PasswordInput
            id="confirmPassword"
            placeholder="Re-enter new password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            hasError={!!errors.confirmPassword}
          />
        </Field>

        <Button type="submit" fullWidth loading={submitting} className="mt-2">
          Reset password
        </Button>

        <p className="text-center text-sm text-ink-500">
          Didn't get a code?{' '}
          <Link to="/forgot-password" className="font-semibold text-brand-700 hover:text-brand-800">
            Request a new one
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Button } from '../components/ui/Button'
import { login, extractErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const res = await login({ email: email.trim().toLowerCase(), password })
      const { data } = res

      if (!data.isEmailVerified) {
        toast('Please verify your email before logging in.', { icon: '📩' })
        navigate('/verify-otp', { state: { email: data.email } })
        return
      }

      setSession({
        organizationId: data.organizationId,
        userId: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        isEmailVerified: data.isEmailVerified,
        companyName: data.companyName,
        plan: data.plan,
        departmentId: data.department,
      })
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      setErrors({ form: extractErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your CEO dashboard to keep petty cash on track.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {errors.form && (
          <div className="rounded-xl bg-[#fbe9e9] px-4 py-3 text-sm text-[#d03b3b]">{errors.form}</div>
        )}

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hasError={!!errors.email}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hasError={!!errors.password}
          />
        </Field>

        <div className="-mt-2 flex justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={submitting}>
          Log in
        </Button>

        <p className="text-center text-sm text-ink-500">
          New to Kashmemo?{' '}
          <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800">
            Create an organization
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

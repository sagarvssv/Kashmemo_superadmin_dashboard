import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MailCheck } from 'lucide-react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { OtpInput } from '../components/ui/OtpInput'
import { Button } from '../components/ui/Button'
import { verifyOtp, extractErrorMessage } from '../lib/api'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const stateEmail = (location.state as { email?: string } | null)?.email ?? ''

  const [email, setEmail] = useState(stateEmail)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter the email you signed up with.')
      return
    }
    if (otp.length !== 6) {
      setError('Enter the 6-digit code sent to your email.')
      return
    }
    setSubmitting(true)
    try {
      const res = await verifyOtp({ email: email.trim().toLowerCase(), otp })
      toast.success(res.data.message || 'Email verified successfully.')
      navigate('/login')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a 6-digit code to your inbox. Enter it below to activate your organization."
    >
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3.5 text-brand-800">
        <MailCheck className="size-5 shrink-0" />
        <p className="text-sm">Check your email (and server logs, in dev mode) for the OTP.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="6-digit code" htmlFor="otp-0" error={error}>
          <OtpInput value={otp} onChange={setOtp} hasError={!!error} />
        </Field>

        <Button type="submit" fullWidth loading={submitting} className="mt-2">
          Verify email
        </Button>

        <p className="text-center text-sm text-ink-500">
          Wrong email?{' '}
          <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800">
            Go back to signup
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

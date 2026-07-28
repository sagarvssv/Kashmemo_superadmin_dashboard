import { useEffect, useState } from 'react'
import { BadgeCheck, Loader2, Mail, Phone, ShieldCheck } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { extractErrorMessage } from '../../lib/api'
import { getProfile, type Profile } from '../../lib/employees'

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const initials = (profile?.name ?? 'C E')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Settings</h1>
        <p className="mt-1 text-[15px] text-ink-500">Your account details.</p>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center gap-2.5 py-20 text-ink-400">
          <Loader2 className="size-5 animate-spin" />
          Loading profile…
        </Card>
      ) : error ? (
        <Card className="py-10 text-center text-[#d03b3b]">{error}</Card>
      ) : profile ? (
        <Card className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-100 font-display text-lg font-bold text-brand-800">
              {initials}
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink-900">{profile.name}</p>
              <p className="text-sm text-ink-500">{profile.designation}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3.5">
              <Mail className="size-[18px] text-brand-600" />
              <div>
                <p className="text-xs text-ink-400">Email</p>
                <p className="text-sm font-medium text-ink-800">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3.5">
              <Phone className="size-[18px] text-brand-600" />
              <div>
                <p className="text-xs text-ink-400">Phone</p>
                <p className="text-sm font-medium text-ink-800">{profile.phoneNumber ?? 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3.5">
              <ShieldCheck className="size-[18px] text-brand-600" />
              <div>
                <p className="text-xs text-ink-400">Role</p>
                <p className="text-sm font-medium text-ink-800">{profile.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3.5">
              <BadgeCheck className="size-[18px] text-brand-600" />
              <div>
                <p className="text-xs text-ink-400">Email verification</p>
                <p className="text-sm font-medium text-ink-800">
                  {profile.isEmailVerified ? 'Verified' : 'Not verified'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

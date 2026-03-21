import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, CircleDollarSign, XCircle } from 'lucide-react'
import { joinByInviteCode } from '../api/groups.api'
import useAuth from '../hooks/useAuth'
import Spinner from '../components/ui/Spinner'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function JoinGroupPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [status, setStatus] = useState('idle')
  const [groupName, setGroupName] = useState('')
  const [countdown, setCountdown] = useState(3)

  const loginRedirect = useMemo(() => `/login?redirect=/join/${code || ''}`, [code])

  useEffect(() => {
    if (!code || !isAuthenticated) return

    setStatus('loading')
    joinByInviteCode(code)
      .then((res) => {
        const name = res?.data?.group?.name || 'your group'
        setGroupName(name)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [code, isAuthenticated])

  useEffect(() => {
    if (status !== 'success') return
    if (countdown <= 0) {
      navigate('/groups')
      return
    }

    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [status, countdown, navigate])

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-100 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <CircleDollarSign size={28} />
          </div>
          <h1 className="text-xl font-bold text-surface-900">Please login first</h1>
          <p className="mt-2 text-sm text-surface-600">You need to be logged in to join this Splitora group.</p>
          <div className="mt-6">
            <Button onClick={() => navigate(loginRedirect)}>Login</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
          <CircleDollarSign size={28} />
        </div>
        <h1 className="text-xl font-bold text-surface-900">You've been invited to join a group on Splitora!</h1>

        {status === 'idle' || status === 'loading' ? (
          <div className="mt-6 space-y-3">
            <div className="flex justify-center"><Spinner size="lg" /></div>
            <p className="text-sm text-surface-600">Joining group...</p>
          </div>
        ) : null}

        {status === 'success' ? (
          <div className="mt-6 space-y-3">
            <div className="flex justify-center text-success-600 animate-pulse">
              <CheckCircle2 size={52} />
            </div>
            <p className="font-semibold text-surface-900">Welcome to {groupName}</p>
            <p className="text-sm text-surface-600">Redirecting to your group in {countdown}...</p>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="mt-6 space-y-4">
            <div className="flex justify-center text-danger-600">
              <XCircle size={52} />
            </div>
            <p className="font-semibold text-surface-900">This invite link is invalid or has expired</p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

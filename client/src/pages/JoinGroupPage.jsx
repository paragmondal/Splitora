import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { joinByInviteCode } from '../api/groups.api'
import Spinner from '../components/ui/Spinner'
import Card from '../components/ui/Card'

export default function JoinGroupPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [groupName, setGroupName] = useState('')

  useEffect(() => {
    if (!code) { setStatus('error'); return }
    joinByInviteCode(code)
      .then((res) => {
        const name = res?.data?.group?.name || 'the group'
        setGroupName(name)
        setStatus('success')
        setTimeout(() => navigate('/groups'), 2000)
      })
      .catch(() => setStatus('error'))
  }, [code, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100 p-4">
      <Card className="max-w-sm w-full text-center p-8">
        {status === 'loading' && <><Spinner size="lg" /><p className="mt-4 text-surface-600">Joining group...</p></>}
        {status === 'success' && <><p className="text-4xl">🎉</p><h2 className="mt-3 text-xl font-bold text-surface-900">You joined {groupName}!</h2><p className="mt-2 text-sm text-surface-600">Redirecting to groups...</p></>}
        {status === 'error' && <><p className="text-4xl">❌</p><h2 className="mt-3 text-xl font-bold text-surface-900">Invalid invite link</h2><p className="mt-2 text-sm text-surface-600">This link may be expired or invalid.</p><button onClick={() => navigate('/')} className="mt-4 text-sm text-primary-600 hover:underline">Go home</button></>}
      </Card>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Link as LinkIcon, Copy } from 'lucide-react'
import { useGroup, useAddMember, useGenerateInviteCode } from '../hooks/useGroups'
import { useDeleteExpense } from '../hooks/useExpenses'
import useSocket from '../hooks/useSocket'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ExpenseCard from '../components/expenses/ExpenseCard'
import AddExpenseModal from '../components/expenses/AddExpenseModal'
import SettlementSuggestions from '../components/settlements/SettlementSuggestions'
import AddMemberModal from '../components/groups/AddMemberModal'

const TABS = ['expenses', 'balances', 'settlements']

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value || 0)

export default function GroupDetailPage() {
  const { id } = useParams()
  useSocket(id)

  const [activeTab, setActiveTab] = useState('expenses')
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  const { data, isLoading, refetch } = useGroup(id)
  const addMemberMutation = useAddMember(id)
  const deleteExpenseMutation = useDeleteExpense(id)
  const inviteMutation = useGenerateInviteCode()

  const group = data?.data?.group || data?.group
  const members = useMemo(() => group?.members || [], [group])
  const expenses = useMemo(() => group?.expenses || [], [group])
  const balances = useMemo(() => group?.balances || [], [group])

  const totalGroupSpending = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-surface-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-200" />
      </div>
    )
  }

  if (!group) {
    return <Card><p className="text-sm text-surface-600">Group not found.</p></Card>
  }

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Delete expense "${expense.title}"?`)) return
    try {
      await deleteExpenseMutation.mutateAsync(expense.id)
      refetch()
    } catch {}
  }

  const handleGenerateInvite = async () => {
    try {
      const response = await inviteMutation.mutateAsync(id)
      const link = response?.data?.inviteUrl || response?.inviteUrl || ''
      setInviteLink(link)
      setIsInviteOpen(true)
    } catch {}
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-surface-900">{group.name}</h1>
              <Badge variant="info">{group.category}</Badge>
            </div>
            {group.description ? <p className="mt-2 text-sm text-surface-600">{group.description}</p> : null}
            <div className="mt-4 flex items-center gap-2">
              {members.map((member) => (
                <Avatar key={member.userId || member.id} user={member.user || member} size="sm" />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" leftIcon={<LinkIcon size={16} />} onClick={handleGenerateInvite}>Invite</Button>
            <Button variant="outline" leftIcon={<Plus size={16} />} onClick={() => setIsAddMemberOpen(true)}>Add Member</Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => setIsAddExpenseOpen(true)}>Add Expense</Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab(tab)}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {expenses.length ? (
            expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} onDelete={handleDeleteExpense} />
            ))
          ) : (
            <Card><p className="text-sm text-surface-600">No expenses yet.</p></Card>
          )}
        </div>
      )}

      {activeTab === 'balances' && (
        <Card>
          <h2 className="mb-2 text-lg font-semibold text-surface-900">Balances</h2>
          <p className="mb-4 text-sm text-surface-600">Total group spending: <span className="font-semibold text-surface-900">{formatCurrency(totalGroupSpending)}</span></p>
          <div className="space-y-2">
            {balances.length ? (
              balances.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
                  <div className="inline-flex items-center gap-2">
                    <Avatar user={{ name: entry.name, avatar: entry.avatar }} size="sm" />
                    <span className="text-sm font-medium text-surface-900">{entry.name}</span>
                  </div>
                  <span className={`text-sm font-semibold ${entry.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {entry.balance >= 0 ? '+' : ''}{formatCurrency(entry.balance)}
                  </span>
                </div>
              ))
            ) : <p className="text-sm text-surface-600">No balances yet.</p>}
          </div>
        </Card>
      )}

      {activeTab === 'settlements' && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-surface-900">Settlement suggestions</h2>
          <SettlementSuggestions groupId={id} />
        </Card>
      )}

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSubmit={(email) => addMemberMutation.mutateAsync(email)}
        loading={addMemberMutation.isPending}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groupId={id}
        members={members}
        onCreated={() => {
          setIsAddExpenseOpen(false)
          refetch()
        }}
      />

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Link" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-surface-600">Share this link to join the group.</p>
          <div className="rounded-lg border border-surface-300 bg-surface-100 p-2 text-xs break-all">{inviteLink}</div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Copy size={14} />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteLink)
                  toast.success('Invite link copied')
                } catch {
                  toast.error('Failed to copy')
                }
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

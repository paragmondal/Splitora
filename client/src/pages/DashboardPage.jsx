import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, HandCoins, Plus, ReceiptText } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { useDashboardStats } from '../hooks/useStats'
import GroupCard from '../components/groups/GroupCard'
import SpendingInsights from '../components/ai/SpendingInsights'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value || 0)

const SkeletonBlock = ({ className }) => (
  <div className={`animate-pulse rounded-xl bg-surface-200 ${className}`} />
)

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading } = useDashboardStats()

  const payload = data?.data || data || {}
  const totalGroups = payload?.totalGroups || 0
  const totalExpensesThisMonth = payload?.totalExpensesThisMonth || 0
  const totalYouOwe = payload?.totalYouOwe || 0
  const totalOwedToYou = payload?.totalOwedToYou || 0
  const recentGroups = payload?.recentGroups || []
  const recentExpenses = payload?.recentExpenses || []

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            {greeting}, {user?.name || 'there'}
          </h1>
          <p className="mt-1 text-sm text-surface-600">
            Here is a quick snapshot of your shared expenses and settlements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/groups')}>
            Create Group
          </Button>
          <Button variant="outline" leftIcon={<ReceiptText size={16} />} onClick={() => navigate('/groups')}>
            Add Expense
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="mt-3 h-7 w-32" />
            </Card>
          ))
        ) : (
          <>
            <Card>
              <div className="text-sm text-surface-600">Total groups</div>
              <div className="mt-2 text-2xl font-bold text-surface-900">{totalGroups}</div>
            </Card>
            <Card>
              <div className="text-sm text-surface-600">Expenses this month</div>
              <div className="mt-2 text-2xl font-bold text-surface-900">{formatCurrency(totalExpensesThisMonth)}</div>
            </Card>
            <Card>
              <div className="text-sm text-surface-600">You owe</div>
              <div className="mt-2 text-2xl font-bold text-danger-600">{formatCurrency(totalYouOwe)}</div>
            </Card>
            <Card>
              <div className="text-sm text-surface-600">Owed to you</div>
              <div className="mt-2 text-2xl font-bold text-success-600">{formatCurrency(totalOwedToYou)}</div>
            </Card>
          </>
        )}
      </section>

      <SpendingInsights />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900">Recent groups</h2>
            <Badge variant="info" size="sm">Last 3</Badge>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="h-24 w-full" />
              ))
            ) : recentGroups.length ? (
              recentGroups.map((group) => (
                <GroupCard key={group.id} {...group} />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-surface-300 p-6 text-center">
                <p className="text-sm text-surface-600">No groups yet.</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900">Recent expenses</h2>
            <Badge variant="default" size="sm">Last 5</Badge>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="h-16 w-full" />
              ))
            ) : recentExpenses.length ? (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Avatar user={expense.paidBy} size="sm" />
                      <p className="truncate text-sm font-semibold text-surface-900">{expense.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-surface-600">
                      {expense.group?.name || 'Unknown group'} • Paid by {expense.paidBy?.name || 'Unknown'} • {new Date(expense.date || expense.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-1 text-sm font-semibold text-surface-800">
                    <ArrowUpRight size={14} className="text-primary-600" />
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-surface-300 p-6 text-center">
                <HandCoins className="mx-auto mb-2 text-surface-400" size={18} />
                <p className="text-sm text-surface-600">No recent expenses found.</p>
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  )
}

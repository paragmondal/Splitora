import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts'
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Crown,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Receipt,
  Scale,
  TrendingUp,
  Wallet
} from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Avatar from '../ui/Avatar'

const CATEGORY_COLORS = {
  food: '#f59e0b',
  travel: '#3b82f6',
  home: '#22c55e',
  event: '#a855f7',
  entertainment: '#ef4444',
  shopping: '#ec4899',
  general: '#6b7280'
}

const PALETTE = ['#7c3aed', '#06b6d4', '#f97316', '#22c55e', '#ef4444', '#6366f1', '#ec4899']

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(v || 0)

const formatDateKey = (dateValue) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return { key: 'invalid', label: 'Unknown', ts: 0 }
  const key = date.toISOString().slice(0, 10)
  const label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  return { key, label, ts: date.getTime() }
}

export default function GroupAnalytics({ expenses = [], members = [], balances = [] }) {
  const {
    totalAmount,
    avgExpense,
    maxExpense,
    categoryData,
    memberSpendingData,
    timelineData,
    topSpender,
    mostActive,
    fairnessScore,
    fairnessRows
  } = useMemo(() => {
    const totalAmountCalc = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
    const avgExpenseCalc = expenses.length ? totalAmountCalc / expenses.length : 0
    const maxExpenseCalc = expenses.length ? Math.max(...expenses.map((e) => Number(e.amount || 0))) : 0

    const categoryDataCalc = Object.entries(
      expenses.reduce((acc, e) => {
        const cat = e.category || 'general'
        acc[cat] = (acc[cat] || 0) + Number(e.amount || 0)
        return acc
      }, {})
    ).map(([name, value]) => ({ name, value }))

    const memberSpendingDataCalc = members.map((member) => {
      const userId = member.user?.id || member.userId || member.id
      const name = member.user?.name || member.name || 'Member'
      const paid = expenses
        .filter((e) => e.paidById === userId)
        .reduce((s, e) => s + Number(e.amount || 0), 0)
      const owed = expenses.reduce((s, e) => {
        const share = e.shares?.find((sh) => sh.userId === userId)
        return s + Number(share?.amount || 0)
      }, 0)
      const txCount = expenses.filter((e) => e.paidById === userId).length
      return {
        name: name.length > 8 ? `${name.slice(0, 8)}...` : name,
        fullName: name,
        paid,
        owed,
        userId,
        txCount,
        avatar: member.user?.avatar || member.avatar || null
      }
    })

    const balanceMap = balances.reduce((acc, b) => {
      acc[b.userId] = Number(b.balance || 0)
      return acc
    }, {})

    const timelineMap = expenses.reduce((acc, e) => {
      const { key, label, ts } = formatDateKey(e.date || e.createdAt)
      if (!acc[key]) acc[key] = { key, date: label, amount: 0, ts }
      acc[key].amount += Number(e.amount || 0)
      return acc
    }, {})

    const timelineDataCalc = Object.values(timelineMap)
      .sort((a, b) => a.ts - b.ts)
      .map(({ date, amount }) => ({ date, amount }))

    const topSpenderCalc = memberSpendingDataCalc.reduce(
      (top, m) => (m.paid > (top?.paid || 0) ? m : top),
      null
    )

    const mostActiveCalc = memberSpendingDataCalc.reduce(
      (top, m) => (m.txCount > (top?.txCount || 0) ? m : top),
      null
    )

    const membersCount = memberSpendingDataCalc.length || 1
    const equalSpend = totalAmountCalc / membersCount
    const totalDeviation = memberSpendingDataCalc.reduce(
      (sum, m) => sum + Math.abs(m.paid - equalSpend),
      0
    )
    const maxDeviation = totalAmountCalc > 0 ? (2 * totalAmountCalc * (membersCount - 1)) / membersCount : 0
    const fairnessScoreCalc =
      maxDeviation === 0
        ? 100
        : Math.max(0, Math.min(100, Math.round((1 - totalDeviation / maxDeviation) * 100)))

    const fairnessRowsCalc = memberSpendingDataCalc.map((m) => {
      const balance = Number(balanceMap[m.userId] || 0)
      const spendSharePct = totalAmountCalc > 0 ? (m.paid / totalAmountCalc) * 100 : 0
      let status = 'Fair'
      let statusVariant = 'default'
      if (balance > 0) {
        status = 'Overpaid'
        statusVariant = 'success'
      } else if (balance < 0) {
        status = 'Owes'
        statusVariant = 'danger'
      }
      return {
        ...m,
        balance,
        spendSharePct,
        status,
        statusVariant
      }
    })

    return {
      totalAmount: totalAmountCalc,
      avgExpense: avgExpenseCalc,
      maxExpense: maxExpenseCalc,
      categoryData: categoryDataCalc,
      memberSpendingData: memberSpendingDataCalc,
      timelineData: timelineDataCalc,
      topSpender: topSpenderCalc,
      mostActive: mostActiveCalc,
      fairnessScore: fairnessScoreCalc,
      fairnessRows: fairnessRowsCalc
    }
  }, [expenses, members, balances])

  const fairnessColor = fairnessScore > 70 ? 'bg-success-500' : fairnessScore >= 40 ? 'bg-warning-500' : 'bg-danger-500'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-surface-600">Total Expenses</p>
            <CircleDollarSign size={16} className="text-primary-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-surface-900">{formatCurrency(totalAmount)}</p>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-surface-600">Total Transactions</p>
            <Receipt size={16} className="text-primary-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-surface-900">{expenses.length}</p>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-surface-600">Biggest Expense</p>
            <TrendingUp size={16} className="text-primary-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-surface-900">{formatCurrency(maxExpense)}</p>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-surface-600">Average Expense</p>
            <Activity size={16} className="text-primary-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-surface-900">{formatCurrency(avgExpense)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-surface-900">Spending by Category</h2>
          </div>
          {categoryData.length ? (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={CATEGORY_COLORS[entry.name] || PALETTE[index % PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categoryData.map((cat, index) => {
                  const pct = totalAmount > 0 ? (cat.value / totalAmount) * 100 : 0
                  const color = CATEGORY_COLORS[cat.name] || PALETTE[index % PALETTE.length]
                  return (
                    <div key={cat.name} className="flex items-center justify-between rounded-xl border border-surface-200 px-3 py-2">
                      <div className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm capitalize text-surface-800">{cat.name}</span>
                      </div>
                      <p className="text-xs text-surface-600">
                        {formatCurrency(cat.value)} ({pct.toFixed(1)}%)
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex h-60 items-center justify-center text-center text-surface-500">
              <p>🍽️ No expense data yet</p>
            </div>
          )}
        </Card>

        <Card className="bg-white">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-surface-900">Spending by Member</h2>
          </div>
          {memberSpendingData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={memberSpendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Member: ${label}`} />
                  <Legend />
                  <Bar dataKey="paid" name="Paid" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="owed" name="Owed" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-center text-surface-500">
              <p>👥 No member spending data yet</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="bg-white">
        <div className="mb-4 flex items-center gap-2">
          <LineChartIcon size={18} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-surface-900">Expense Timeline</h2>
        </div>
        {timelineData.length >= 2 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="amount" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-center text-surface-500">
            <p>📈 Add more expenses to see timeline</p>
          </div>
        )}
      </Card>

      <Card className="bg-white">
        <div className="mb-4 flex items-center gap-2">
          <Scale size={18} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-surface-900">Fair Split Analysis</h2>
        </div>

        {fairnessRows.length ? (
          <div className="space-y-3">
            {fairnessRows.map((row) => (
              <div key={row.userId} className="rounded-xl border border-surface-200 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2">
                    <Avatar user={{ name: row.fullName, avatar: row.avatar }} size="sm" />
                    <span className="text-sm font-medium text-surface-900">{row.fullName}</span>
                    <Badge size="sm" variant={row.statusVariant}>{row.status}</Badge>
                  </div>
                  <span className={`text-sm font-semibold ${row.balance > 0 ? 'text-success-600' : row.balance < 0 ? 'text-danger-600' : 'text-surface-700'}`}>
                    {row.balance > 0 ? '+' : ''}
                    {formatCurrency(row.balance)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-200">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, Math.max(0, row.spendSharePct))}%` }} />
                </div>
                <p className="mt-1 text-xs text-surface-600">Spending share: {row.spendSharePct.toFixed(1)}%</p>
              </div>
            ))}

            <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-surface-900">Fairness Score: {fairnessScore}%</p>
                <Badge variant={fairnessScore > 70 ? 'success' : fairnessScore >= 40 ? 'warning' : 'danger'} size="sm">
                  {fairnessScore > 70 ? 'Well Balanced' : fairnessScore >= 40 ? 'Moderate' : 'Needs Rebalance'}
                </Badge>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-200">
                <div className={`h-full rounded-full ${fairnessColor}`} style={{ width: `${fairnessScore}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center text-center text-surface-500">
            <p>⚖️ No split data yet</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <div className="mb-3 flex items-center gap-2">
            <Crown size={18} className="text-warning-600" />
            <h2 className="text-lg font-semibold text-surface-900">Top Spender</h2>
          </div>
          {topSpender && topSpender.paid > 0 ? (
            <div className="flex items-center gap-3">
              <Avatar user={{ name: topSpender.fullName, avatar: topSpender.avatar }} size="lg" />
              <div>
                <p className="font-semibold text-surface-900">{topSpender.fullName}</p>
                <p className="text-sm text-surface-700">{formatCurrency(topSpender.paid)}</p>
                <p className="text-xs text-surface-500">Paid the most in this group</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-surface-500">No data yet</p>
          )}
        </Card>

        <Card className="bg-white">
          <div className="mb-3 flex items-center gap-2">
            <Wallet size={18} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-surface-900">Most Transactions</h2>
          </div>
          {mostActive && mostActive.txCount > 0 ? (
            <div className="flex items-center gap-3">
              <Avatar user={{ name: mostActive.fullName, avatar: mostActive.avatar }} size="lg" />
              <div>
                <p className="font-semibold text-surface-900">{mostActive.fullName}</p>
                <p className="text-sm text-surface-700">{mostActive.txCount} transactions</p>
                <p className="text-xs text-surface-500">Most transactions</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-surface-500">No data yet</p>
          )}
        </Card>
      </div>
    </div>
  )
}

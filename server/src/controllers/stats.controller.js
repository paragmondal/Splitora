const prisma = require('../config/db')
const ApiResponse = require('../utils/apiResponse')
const { calculateBalances } = require('../services/settlement.service')

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const groups = await prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { members: true } },
        expenses: { select: { amount: true, date: true }, orderBy: { createdAt: 'desc' } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const totalExpensesThisMonth = groups
      .flatMap(g => g.expenses)
      .filter(e => new Date(e.date) >= startOfMonth)
      .reduce((s, e) => s + e.amount, 0)

    let totalYouOwe = 0
    let totalOwedToYou = 0

    for (const group of groups) {
      try {
        const balances = await calculateBalances(group.id)
        const userBalance = balances[userId] || 0
        if (userBalance < 0) totalYouOwe += Math.abs(userBalance)
        else totalOwedToYou += userBalance
      } catch {}
    }

    const recentExpenses = await prisma.expense.findMany({
      where: { group: { members: { some: { userId } } } },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatar: true } },
        group: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return ApiResponse.success(res, {
      totalGroups: groups.length,
      totalExpensesThisMonth,
      totalYouOwe,
      totalOwedToYou,
      recentGroups: groups.slice(0, 3).map(g => ({
        id: g.id, name: g.name, category: g.category,
        memberCount: g._count.members, members: g.members,
        updatedAt: g.updatedAt, createdAt: g.createdAt
      })),
      recentExpenses
    }, 'Dashboard stats fetched')
  } catch (err) { return next(err) }
}

module.exports = { getDashboardStats }

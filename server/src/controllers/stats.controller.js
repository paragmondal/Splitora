const prisma = require('../config/db')
const ApiResponse = require('../utils/apiResponse')

const getUserId = (req) => req.user && req.user.userId

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = getUserId(req)

    if (!userId) {
      return ApiResponse.error(res, 'Unauthorized', 401)
    }

    // Fetch all groups the user belongs to
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    })
    const groupIds = memberships.map((m) => m.groupId)

    // Fetch groups with basic info
    const groups = await prisma.group.findMany({
      where: { id: { in: groupIds } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { members: true } },
      },
    })

    // Total expenses this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const monthlyExpenses = await prisma.expense.findMany({
      where: {
        groupId: { in: groupIds },
        date: { gte: startOfMonth },
      },
      select: { amount: true },
    })
    const totalExpensesThisMonth = monthlyExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    )

    // Balance calculations across all groups
    const allExpenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      select: {
        paidById: true,
        amount: true,
        shares: { select: { userId: true, amount: true, isPaid: true } },
      },
    })

    let totalYouOwe = 0
    let totalOwedToYou = 0

    const balanceMap = {}
    for (const expense of allExpenses) {
      if (!balanceMap[expense.paidById]) balanceMap[expense.paidById] = 0
      balanceMap[expense.paidById] += Number(expense.amount)
      for (const share of expense.shares) {
        if (!balanceMap[share.userId]) balanceMap[share.userId] = 0
        balanceMap[share.userId] -= Number(share.amount)
      }
    }

    const myBalance = balanceMap[userId] || 0
    if (myBalance < 0) {
      totalYouOwe = Math.abs(myBalance)
    } else {
      totalOwedToYou = myBalance
    }

    // Recent groups (last 3)
    const recentGroups = groups.slice(0, 3).map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category,
      description: g.description,
      memberCount: g._count.members,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }))

    // Recent expenses (last 5 across all groups)
    const recentExpenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        paidBy: { select: { id: true, name: true, avatar: true } },
        group: { select: { id: true, name: true } },
      },
    })

    return ApiResponse.success(
      res,
      {
        totalGroups: groups.length,
        totalExpensesThisMonth: Number(totalExpensesThisMonth.toFixed(2)),
        totalYouOwe: Number(totalYouOwe.toFixed(2)),
        totalOwedToYou: Number(totalOwedToYou.toFixed(2)),
        recentGroups,
        recentExpenses,
      },
      'Dashboard stats fetched successfully'
    )
  } catch (err) {
    return next(err)
  }
}

module.exports = { getDashboardStats }

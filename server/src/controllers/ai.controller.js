const Anthropic = require('@anthropic-ai/sdk')
const prisma = require('../config/db')
const ApiResponse = require('../utils/apiResponse')

const getSpendingInsights = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const expenses = await prisma.expense.findMany({
      where: { paidById: userId, date: { gte: thirtyDaysAgo } },
      include: { group: { select: { name: true } } }
    })

    if (!expenses.length) {
      return ApiResponse.success(res, { insights: [
        { title: 'Start tracking', insight: 'Add your first expense to get AI insights about your spending.', type: 'info' }
      ]}, 'Insights generated')
    }

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
    const categories = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {})
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general'
    const avgExpense = totalSpent / expenses.length
    const biggestExpense = Math.max(...expenses.map(e => e.amount))
    const groupCount = new Set(expenses.map(e => e.groupId)).size

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyze these expense stats and give 3 short friendly actionable insights as JSON array. Each object must have: title (3-5 words), insight (one sentence max 15 words), type (info/warning/success). Stats: total spent ₹${totalSpent.toFixed(0)}, top category: ${topCategory}, avg expense: ₹${avgExpense.toFixed(0)}, biggest: ₹${biggestExpense}, groups: ${groupCount}. Return ONLY the JSON array, no other text.`
        }]
      })
      const text = message.content[0].text.trim()
      const clean = text.replace(/```json|```/g, '').trim()
      const insights = JSON.parse(clean)
      return ApiResponse.success(res, { insights }, 'Insights generated')
    } catch {
      return ApiResponse.success(res, { insights: [
        { title: 'Spending summary', insight: `You spent ₹${totalSpent.toFixed(0)} this month across ${groupCount} groups.`, type: 'info' },
        { title: 'Top category', insight: `Your biggest spending category is ${topCategory}.`, type: 'info' },
        { title: 'Average expense', insight: `Your average expense is ₹${avgExpense.toFixed(0)}.`, type: 'success' }
      ]}, 'Insights generated')
    }
  } catch (err) { return next(err) }
}

const getSplitSuggestion = async (req, res, next) => {
  try {
    const { groupId, expenseTitle, amount } = req.body
    if (!groupId) return ApiResponse.error(res, 'groupId required', 400)

    const recentExpenses = await prisma.expense.findMany({
      where: { groupId },
      select: { splitType: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const splitCounts = recentExpenses.reduce((acc, e) => { acc[e.splitType] = (acc[e.splitType] || 0) + 1; return acc }, {})
    const mostUsed = Object.entries(splitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'equal'

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `For expense "${expenseTitle || 'expense'}" of ₹${amount || 0} in a group that mostly uses ${mostUsed} split, suggest best split. Return ONLY JSON: { "suggestedSplit": "equal|percentage|custom", "reasoning": "max 10 words", "confidence": "high|medium|low" }`
        }]
      })
      const text = message.content[0].text.trim()
      const clean = text.replace(/```json|```/g, '').trim()
      const suggestion = JSON.parse(clean)
      return ApiResponse.success(res, suggestion, 'Split suggestion generated')
    } catch {
      return ApiResponse.success(res, { suggestedSplit: mostUsed, reasoning: `This group mostly uses ${mostUsed} split`, confidence: 'medium' }, 'Split suggestion generated')
    }
  } catch (err) { return next(err) }
}

module.exports = { getSpendingInsights, getSplitSuggestion }

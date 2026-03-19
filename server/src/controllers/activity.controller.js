const prisma = require('../config/db')
const ApiResponse = require('../utils/apiResponse')

const getUserId = (req) => req.user && req.user.userId

const getRecentActivity = async (req, res, next) => {
  try {
    const userId = getUserId(req)

    if (!userId) {
      return ApiResponse.error(res, 'Unauthorized', 401)
    }

    // Fetch IDs of all groups the user belongs to
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    })

    const groupIds = memberships.map((m) => m.groupId)

    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          { userId },
          { groupId: { in: groupIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    })

    return ApiResponse.success(res, { activities }, 'Activity fetched successfully')
  } catch (err) {
    return next(err)
  }
}

module.exports = { getRecentActivity }

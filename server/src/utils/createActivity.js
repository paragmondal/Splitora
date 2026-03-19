const createActivity = async (prisma, { type, message, groupId, userId }) => {
  try {
    await prisma.activity.create({ data: { type, message, groupId: groupId || null, userId } })
  } catch (_err) {
    // Activity creation failure should never break the main flow
  }
}

module.exports = createActivity

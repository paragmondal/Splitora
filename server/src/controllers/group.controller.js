const prisma = require("../config/db");
const ApiResponse = require("../utils/apiResponse");

const getUserId = (req) => req.user && req.user.userId;

const createGroup = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { name, description, category } = req.body;

    if (!userId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    if (!name || !String(name).trim()) {
      return ApiResponse.error(res, "Group name is required", 400);
    }

    const group = await prisma.group.create({
      data: {
        name: String(name).trim(),
        description: description || null,
        category: category || "general",
        createdById: userId,
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return ApiResponse.success(res, { group }, "Group created successfully", 201);
  } catch (err) {
    return next(err);
  }
};

const getMyGroups = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
        expenses: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = groups.map((group) => {
      const totalExpenseAmount = group.expenses.reduce((sum, expense) => sum + expense.amount, 0);

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        createdById: group.createdById,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        memberCount: group._count.members,
        totalExpenseAmount,
      };
    });

    return ApiResponse.success(res, { groups: data }, "Groups fetched successfully");
  } catch (err) {
    return next(err);
  }
};

const getGroupById = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const groupId = req.params.id;

    if (!userId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        expenses: {
          include: {
            paidBy: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            shares: {
              select: {
                id: true,
                userId: true,
                amount: true,
                percentage: true,
                isPaid: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!group) {
      return ApiResponse.error(res, "Group not found", 404);
    }

    const balancesMap = new Map();

    group.members.forEach((member) => {
      balancesMap.set(member.userId, {
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
        paid: 0,
        owed: 0,
      });
    });

    group.expenses.forEach((expense) => {
      const payer = balancesMap.get(expense.paidById);
      if (payer) {
        payer.paid += expense.amount;
      }

      expense.shares.forEach((share) => {
        const debtor = balancesMap.get(share.userId);
        if (debtor) {
          debtor.owed += share.amount;
        }
      });
    });

    const balances = Array.from(balancesMap.values()).map((entry) => ({
      ...entry,
      balance: Number((entry.paid - entry.owed).toFixed(2)),
    }));

    return ApiResponse.success(
      res,
      {
        group: {
          ...group,
          balances,
        },
      },
      "Group fetched successfully"
    );
  } catch (err) {
    return next(err);
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const groupId = req.params.id;
    const { name, description, category } = req.body;

    if (!userId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    if (membership.role !== "admin") {
      return ApiResponse.error(res, "Only group admin can update group", 403);
    }

    const data = {};

    if (name !== undefined) {
      data.name = String(name).trim();
    }
    if (description !== undefined) {
      data.description = description;
    }
    if (category !== undefined) {
      data.category = category;
    }

    if (Object.keys(data).length === 0) {
      return ApiResponse.error(res, "No fields provided for update", 400);
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data,
    });

    return ApiResponse.success(res, { group }, "Group updated successfully");
  } catch (err) {
    return next(err);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const groupId = req.params.id;

    if (!userId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    if (membership.role !== "admin") {
      return ApiResponse.error(res, "Only group admin can delete group", 403);
    }

    await prisma.group.delete({
      where: { id: groupId },
    });

    return ApiResponse.success(res, null, "Group deleted successfully");
  } catch (err) {
    return next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const groupId = req.params.id;
    const { email } = req.body;

    if (!userId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    if (!email || !String(email).trim()) {
      return ApiResponse.error(res, "Member email is required", 400);
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    if (membership.role !== "admin") {
      return ApiResponse.error(res, "Only group admin can add members", 403);
    }

    const userToAdd = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    if (!userToAdd) {
      return ApiResponse.error(res, "User not found", 404);
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userToAdd.id,
          groupId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMember) {
      return ApiResponse.error(res, "User is already a member of this group", 400);
    }

    const newMember = await prisma.groupMember.create({
      data: {
        userId: userToAdd.id,
        groupId,
        role: "member",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return ApiResponse.success(res, { member: newMember }, "Member added successfully", 201);
  } catch (err) {
    return next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const requesterId = getUserId(req);
    const groupId = req.params.id;
    const userIdToRemove = req.params.userId;

    if (!requesterId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const requesterMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: requesterId,
          groupId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!requesterMembership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    if (requesterMembership.role !== "admin") {
      return ApiResponse.error(res, "Only group admin can remove members", 403);
    }

    const targetMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userIdToRemove,
          groupId,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!targetMembership) {
      return ApiResponse.error(res, "Member not found in this group", 404);
    }

    if (requesterId === userIdToRemove && requesterMembership.role === "admin") {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId,
          role: "admin",
        },
      });

      if (adminCount === 1) {
        return ApiResponse.error(res, "Cannot remove yourself as the only admin", 400);
      }
    }

    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: userIdToRemove,
          groupId,
        },
      },
    });

    return ApiResponse.success(res, null, "Member removed successfully");
  } catch (err) {
    return next(err);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const groupId = req.params.id;

    if (!userId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      return ApiResponse.error(res, "You are not a member of this group", 404);
    }

    const memberCount = await prisma.groupMember.count({
      where: { groupId },
    });

    if (memberCount === 1) {
      await prisma.group.delete({
        where: { id: groupId },
      });

      return ApiResponse.success(res, null, "You left the group. Group deleted as it had no members left");
    }

    if (membership.role === "admin") {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId,
          role: "admin",
        },
      });

      if (adminCount === 1) {
        const replacementAdmin = await prisma.groupMember.findFirst({
          where: {
            groupId,
            userId: {
              not: userId,
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
          select: {
            userId: true,
          },
        });

        if (!replacementAdmin) {
          return ApiResponse.error(res, "Unable to transfer admin role", 400);
        }

        await prisma.$transaction([
          prisma.groupMember.update({
            where: {
              userId_groupId: {
                userId: replacementAdmin.userId,
                groupId,
              },
            },
            data: {
              role: "admin",
            },
          }),
          prisma.groupMember.delete({
            where: {
              userId_groupId: {
                userId,
                groupId,
              },
            },
          }),
        ]);

        return ApiResponse.success(res, null, "You left the group. Admin role transferred to another member");
      }
    }

    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    return ApiResponse.success(res, null, "You left the group successfully");
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup,
};
module.exports.default = {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup,
};

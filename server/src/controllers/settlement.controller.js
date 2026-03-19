const prisma = require("../config/db");
const ApiResponse = require("../utils/apiResponse");
const createActivity = require("../utils/createActivity");
const {
  calculateBalances,
  simplifyDebts,
} = require("../services/settlement.service");

const getUserId = (req) => req.user && req.user.userId;
const toCents = (value) => Math.round(Number(value) * 100);

const getMembership = async (userId, groupId) =>
  prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    select: {
      role: true,
      userId: true,
    },
  });

const getSettlementSuggestions = async (req, res, next) => {
  try {
    const requesterId = getUserId(req);
    const { groupId } = req.params;

    if (!requesterId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const membership = await getMembership(requesterId, groupId);
    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    const balances = await calculateBalances(groupId);
    const suggestions = simplifyDebts(balances);

    const userIds = [...new Set(suggestions.flatMap((item) => [item.from, item.to]))];
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const enriched = suggestions.map((item) => ({
      ...item,
      fromUser: userMap[item.from] || null,
      toUser: userMap[item.to] || null,
    }));

    return ApiResponse.success(
      res,
      {
        balances,
        suggestions: enriched,
      },
      "Settlement suggestions fetched successfully"
    );
  } catch (err) {
    return next(err);
  }
};

const createSettlement = async (req, res, next) => {
  try {
    const requesterId = getUserId(req);
    const {
      groupId,
      payerId,
      receiverId,
      amount,
      paymentMethod,
      transactionId,
      note,
    } = req.body;

    if (!requesterId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    if (!groupId || !receiverId || amount === undefined) {
      return ApiResponse.error(res, "groupId, receiverId, and amount are required", 400);
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return ApiResponse.error(res, "Amount must be a positive number", 400);
    }

    const actualPayerId = payerId || requesterId;
    if (actualPayerId === receiverId) {
      return ApiResponse.error(res, "Payer and receiver cannot be the same user", 400);
    }

    const requesterMembership = await getMembership(requesterId, groupId);
    if (!requesterMembership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    const participants = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: {
          in: [actualPayerId, receiverId],
        },
      },
      select: {
        userId: true,
      },
    });

    if (participants.length !== 2) {
      return ApiResponse.error(res, "Payer and receiver must both be group members", 400);
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        payerId: actualPayerId,
        receiverId,
        amount: parsedAmount,
        status: "pending",
        paymentMethod: paymentMethod || null,
        transactionId: transactionId || null,
        note: note || null,
      },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return ApiResponse.success(res, { settlement }, "Settlement created successfully", 201);
  } catch (err) {
    return next(err);
  }
};

const confirmSettlement = async (req, res, next) => {
  try {
    const requesterId = getUserId(req);
    const { id } = req.params;

    if (!requesterId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const existingSettlement = await prisma.settlement.findUnique({
      where: { id },
      select: {
        id: true,
        groupId: true,
        payerId: true,
        receiverId: true,
        amount: true,
        status: true,
      },
    });

    if (!existingSettlement) {
      return ApiResponse.error(res, "Settlement not found", 404);
    }

    const membership = await getMembership(requesterId, existingSettlement.groupId);
    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    if (existingSettlement.status === "completed") {
      return ApiResponse.success(res, { settlement: existingSettlement }, "Settlement already completed");
    }

    const confirmedSettlement = await prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.update({
        where: { id },
        data: {
          status: "completed",
        },
        include: {
          payer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      let remainingCents = toCents(settlement.amount);

      const candidateShares = await tx.expenseShare.findMany({
        where: {
          isPaid: false,
          userId: settlement.payerId,
          expense: {
            groupId: settlement.groupId,
            paidById: settlement.receiverId,
          },
        },
        include: {
          expense: {
            select: {
              date: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          {
            expense: {
              date: "asc",
            },
          },
          {
            expense: {
              createdAt: "asc",
            },
          },
        ],
      });

      for (const share of candidateShares) {
        if (remainingCents <= 0) {
          break;
        }

        const shareCents = toCents(share.amount);
        if (shareCents <= remainingCents) {
          await tx.expenseShare.update({
            where: { id: share.id },
            data: { isPaid: true },
          });
          remainingCents -= shareCents;
        }
      }

      return settlement;
    });

    await createActivity(prisma, {
      type: 'settlement_done',
      message: `${confirmedSettlement.payer?.name || 'Someone'} paid ${confirmedSettlement.receiver?.name || 'Someone'} ₹${Number(confirmedSettlement.amount)}`,
      groupId: confirmedSettlement.groupId,
      userId: requesterId,
    });

    return ApiResponse.success(
      res,
      {
        settlement: confirmedSettlement,
      },
      "Settlement confirmed successfully"
    );
  } catch (err) {
    return next(err);
  }
};

const getGroupSettlements = async (req, res, next) => {
  try {
    const requesterId = getUserId(req);
    const { groupId } = req.params;

    if (!requesterId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const membership = await getMembership(requesterId, groupId);
    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ApiResponse.success(res, { settlements }, "Group settlements fetched successfully");
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getSettlementSuggestions,
  createSettlement,
  confirmSettlement,
  getGroupSettlements,
};
module.exports.default = {
  getSettlementSuggestions,
  createSettlement,
  confirmSettlement,
  getGroupSettlements,
};

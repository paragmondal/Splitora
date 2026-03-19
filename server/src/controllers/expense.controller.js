const prisma = require("../config/db");
const ApiResponse = require("../utils/apiResponse");
const createActivity = require("../utils/createActivity");

const getUserId = (req) => req.user && req.user.userId;

const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (value) => Number((value / 100).toFixed(2));

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
      groupId: true,
    },
  });

const ensureMembersBelongToGroup = async (groupId, userIds) => {
  const uniqueUserIds = [...new Set(userIds)];

  const count = await prisma.groupMember.count({
    where: {
      groupId,
      userId: {
        in: uniqueUserIds,
      },
    },
  });

  return count === uniqueUserIds.length;
};

const buildShares = ({ splitType, amount, memberIds, sharesInput }) => {
  const normalizedType = String(splitType || "equal").toLowerCase();
  const totalCents = toCents(amount);

  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (normalizedType === "equal") {
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      throw new Error("memberIds are required for equal split");
    }

    const uniqueMemberIds = [...new Set(memberIds)];
    const base = Math.floor(totalCents / uniqueMemberIds.length);
    const remainder = totalCents - base * uniqueMemberIds.length;

    return {
      splitType: "equal",
      memberIds: uniqueMemberIds,
      shares: uniqueMemberIds.map((userId, index) => ({
        userId,
        amount: fromCents(base + (index < remainder ? 1 : 0)),
        percentage: null,
      })),
    };
  }

  if (!Array.isArray(sharesInput) || sharesInput.length === 0) {
    throw new Error("shares are required for percentage and custom splits");
  }

  const normalizedShares = sharesInput.map((item) => ({
    userId: item.userId,
    amount: item.amount,
    percentage: item.percentage,
  }));

  const uniqueMemberIds = [...new Set(normalizedShares.map((item) => item.userId))];
  if (uniqueMemberIds.length !== normalizedShares.length) {
    throw new Error("Duplicate users are not allowed in shares");
  }

  if (normalizedType === "percentage") {
    const percentageTotal = normalizedShares.reduce(
      (sum, item) => sum + Number(item.percentage || 0),
      0
    );

    if (Math.abs(percentageTotal - 100) > 0.0001) {
      throw new Error("Percentages must sum to 100");
    }

    let assigned = 0;
    const shares = normalizedShares.map((item, index) => {
      const percentage = Number(item.percentage);

      if (!Number.isFinite(percentage) || percentage < 0) {
        throw new Error("Each percentage must be a valid non-negative number");
      }

      if (index === normalizedShares.length - 1) {
        const amountCents = totalCents - assigned;
        return {
          userId: item.userId,
          amount: fromCents(amountCents),
          percentage,
        };
      }

      const amountCents = Math.round((totalCents * percentage) / 100);
      assigned += amountCents;

      return {
        userId: item.userId,
        amount: fromCents(amountCents),
        percentage,
      };
    });

    return {
      splitType: "percentage",
      memberIds: uniqueMemberIds,
      shares,
    };
  }

  if (normalizedType === "custom") {
    const shareCents = normalizedShares.map((item) => {
      const amountCents = toCents(item.amount);
      if (!Number.isFinite(amountCents) || amountCents < 0) {
        throw new Error("Each custom amount must be a valid non-negative number");
      }
      return amountCents;
    });

    const customTotal = shareCents.reduce((sum, value) => sum + value, 0);
    if (customTotal !== totalCents) {
      throw new Error("Custom split amounts must sum to total amount");
    }

    return {
      splitType: "custom",
      memberIds: uniqueMemberIds,
      shares: normalizedShares.map((item, index) => ({
        userId: item.userId,
        amount: fromCents(shareCents[index]),
        percentage: null,
      })),
    };
  }

  throw new Error("Invalid splitType. Use equal, percentage, or custom");
};

const createExpense = async (req, res, next) => {
  try {
    const requesterId = getUserId(req);
    const {
      groupId,
      title,
      amount,
      splitType,
      category,
      note,
      receiptUrl,
      date,
      paidById,
      memberIds,
      shares,
    } = req.body;

    if (!requesterId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    if (!groupId || !title || amount === undefined) {
      return ApiResponse.error(res, "groupId, title, and amount are required", 400);
    }

    const membership = await getMembership(requesterId, groupId);
    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    const split = buildShares({
      splitType,
      amount,
      memberIds,
      sharesInput: shares,
    });

    const payerId = paidById || requesterId;

    const usersAreMembers = await ensureMembersBelongToGroup(groupId, [...split.memberIds, payerId]);
    if (!usersAreMembers) {
      return ApiResponse.error(res, "All members and payer must belong to the group", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          groupId,
          title,
          amount: Number(amount),
          splitType: split.splitType,
          category: category || "general",
          note: note || null,
          receiptUrl: receiptUrl || null,
          date: date ? new Date(date) : new Date(),
          paidById: payerId,
        },
      });

      await tx.expenseShare.createMany({
        data: split.shares.map((item) => ({
          expenseId: expense.id,
          userId: item.userId,
          amount: item.amount,
          percentage: item.percentage,
        })),
      });

      return tx.expense.findUnique({
        where: { id: expense.id },
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
    });

    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } });
    await createActivity(prisma, {
      type: 'expense_added',
      message: `${result?.paidBy?.name || 'Someone'} added ${title} ₹${Number(amount)} to ${group?.name || 'group'}`,
      groupId,
      userId: requesterId,
    });

    return ApiResponse.success(res, { expense: result }, "Expense created successfully", 201);
  } catch (err) {
    return next(err);
  }
};

const getGroupExpenses = async (req, res, next) => {
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

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where: { groupId } }),
      prisma.expense.findMany({
        where: { groupId },
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
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return ApiResponse.paginated(
      res,
      expenses,
      {
        page,
        limit,
        total,
        totalPages,
      },
      "Expenses fetched successfully"
    );
  } catch (err) {
    return next(err);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const requesterId = getUserId(req);
    const { id } = req.params;

    if (!requesterId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        shares: {
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

    if (!expense) {
      return ApiResponse.error(res, "Expense not found", 404);
    }

    const membership = await getMembership(requesterId, expense.groupId);
    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    return ApiResponse.success(res, { expense }, "Expense fetched successfully");
  } catch (err) {
    return next(err);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const requesterId = getUserId(req);
    const { id } = req.params;

    if (!requesterId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        shares: true,
      },
    });

    if (!existingExpense) {
      return ApiResponse.error(res, "Expense not found", 404);
    }

    const membership = await getMembership(requesterId, existingExpense.groupId);
    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    const isAdmin = membership.role === "admin";
    const isCreator = existingExpense.paidById === requesterId;

    if (!isAdmin && !isCreator) {
      return ApiResponse.error(res, "Only expense creator or group admin can update", 403);
    }

    const {
      title,
      amount,
      splitType,
      category,
      note,
      receiptUrl,
      date,
      paidById,
      memberIds,
      shares,
    } = req.body;

    const nextAmount = amount !== undefined ? Number(amount) : existingExpense.amount;
    const nextSplitType = splitType || existingExpense.splitType;

    const fallbackMemberIds = existingExpense.shares.map((item) => item.userId);
    const fallbackShares = existingExpense.shares.map((item) => ({
      userId: item.userId,
      amount: item.amount,
      percentage: item.percentage,
    }));

    const split = buildShares({
      splitType: nextSplitType,
      amount: nextAmount,
      memberIds: memberIds || fallbackMemberIds,
      sharesInput: shares || fallbackShares,
    });

    const nextPayerId = paidById || existingExpense.paidById;
    const usersAreMembers = await ensureMembersBelongToGroup(existingExpense.groupId, [
      ...split.memberIds,
      nextPayerId,
    ]);

    if (!usersAreMembers) {
      return ApiResponse.error(res, "All members and payer must belong to the group", 400);
    }

    const updatedExpense = await prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existingExpense.title,
          amount: nextAmount,
          splitType: split.splitType,
          category: category !== undefined ? category : existingExpense.category,
          note: note !== undefined ? note : existingExpense.note,
          receiptUrl: receiptUrl !== undefined ? receiptUrl : existingExpense.receiptUrl,
          date: date !== undefined ? new Date(date) : existingExpense.date,
          paidById: nextPayerId,
        },
      });

      await tx.expenseShare.deleteMany({
        where: { expenseId: id },
      });

      await tx.expenseShare.createMany({
        data: split.shares.map((item) => ({
          expenseId: id,
          userId: item.userId,
          amount: item.amount,
          percentage: item.percentage,
        })),
      });

      return tx.expense.findUnique({
        where: { id },
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
    });

    return ApiResponse.success(res, { expense: updatedExpense }, "Expense updated successfully");
  } catch (err) {
    return next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const requesterId = getUserId(req);
    const { id } = req.params;

    if (!requesterId) {
      return ApiResponse.error(res, "Unauthorized", 401);
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
        groupId: true,
        paidById: true,
      },
    });

    if (!expense) {
      return ApiResponse.error(res, "Expense not found", 404);
    }

    const membership = await getMembership(requesterId, expense.groupId);
    if (!membership) {
      return ApiResponse.error(res, "Access denied: not a group member", 403);
    }

    const isAdmin = membership.role === "admin";
    const isCreator = expense.paidById === requesterId;

    if (!isAdmin && !isCreator) {
      return ApiResponse.error(res, "Only expense creator or group admin can delete", 403);
    }

    await prisma.expense.delete({
      where: { id },
    });

    return ApiResponse.success(res, null, "Expense deleted successfully");
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
module.exports.default = {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};

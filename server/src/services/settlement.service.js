const prisma = require("../config/db");

const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (value) => Number((value / 100).toFixed(2));

const calculateBalances = async (groupId) => {
  const [expenses, completedSettlements] = await Promise.all([
    prisma.expense.findMany({
      where: { groupId },
      select: {
        id: true,
        paidById: true,
        amount: true,
        shares: {
          select: {
            userId: true,
            amount: true,
          },
        },
      },
    }),
    prisma.settlement.findMany({
      where: {
        groupId,
        status: "completed",
      },
      select: {
        payerId: true,
        receiverId: true,
        amount: true,
      },
    }),
  ]);

  const balancesInCents = {};

  const ensureKey = (userId) => {
    if (balancesInCents[userId] === undefined) {
      balancesInCents[userId] = 0;
    }
  };

  for (const expense of expenses) {
    ensureKey(expense.paidById);
    balancesInCents[expense.paidById] += toCents(expense.amount);

    for (const share of expense.shares) {
      ensureKey(share.userId);
      balancesInCents[share.userId] -= toCents(share.amount);
    }
  }

  for (const settlement of completedSettlements) {
    ensureKey(settlement.payerId);
    ensureKey(settlement.receiverId);

    const settlementAmount = toCents(settlement.amount);
    balancesInCents[settlement.payerId] += settlementAmount;
    balancesInCents[settlement.receiverId] -= settlementAmount;
  }

  const balances = {};
  Object.entries(balancesInCents).forEach(([userId, cents]) => {
    balances[userId] = fromCents(cents);
  });

  return balances;
};

const simplifyDebts = (balances) => {
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([userId, amount]) => {
    const cents = toCents(amount);
    if (cents > 0) {
      creditors.push({ userId, amount: cents });
    } else if (cents < 0) {
      debtors.push({ userId, amount: Math.abs(cents) });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settleAmount = Math.min(debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: fromCents(settleAmount),
    });

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount === 0) {
      i += 1;
    }

    if (creditor.amount === 0) {
      j += 1;
    }
  }

  return transactions;
};

module.exports = {
  calculateBalances,
  simplifyDebts,
};
module.exports.default = {
  calculateBalances,
  simplifyDebts,
};

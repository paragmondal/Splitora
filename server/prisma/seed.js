const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const IDS = {
  users: {
    alice: "11111111-1111-4111-8111-111111111111",
    bob: "22222222-2222-4222-8222-222222222222",
    charlie: "33333333-3333-4333-8333-333333333333",
  },
  group: "44444444-4444-4444-8444-444444444444",
  expenses: {
    hotel: "55555555-5555-4555-8555-555555555555",
    dinner: "66666666-6666-4666-8666-666666666666",
    scuba: "77777777-7777-4777-8777-777777777777",
  },
};

async function seedUsers() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@test.com" },
    update: {
      name: "Alice",
      passwordHash,
    },
    create: {
      id: IDS.users.alice,
      name: "Alice",
      email: "alice@test.com",
      passwordHash,
    },
  });
  console.log(`✅ User seeded: ${alice.name} (${alice.email})`);

  const bob = await prisma.user.upsert({
    where: { email: "bob@test.com" },
    update: {
      name: "Bob",
      passwordHash,
    },
    create: {
      id: IDS.users.bob,
      name: "Bob",
      email: "bob@test.com",
      passwordHash,
    },
  });
  console.log(`✅ User seeded: ${bob.name} (${bob.email})`);

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@test.com" },
    update: {
      name: "Charlie",
      passwordHash,
    },
    create: {
      id: IDS.users.charlie,
      name: "Charlie",
      email: "charlie@test.com",
      passwordHash,
    },
  });
  console.log(`✅ User seeded: ${charlie.name} (${charlie.email})`);

  return { alice, bob, charlie };
}

async function seedGroup(alice, bob, charlie) {
  const group = await prisma.group.upsert({
    where: { id: IDS.group },
    update: {
      name: "Goa Trip 2024",
      category: "travel",
      createdById: alice.id,
    },
    create: {
      id: IDS.group,
      name: "Goa Trip 2024",
      category: "travel",
      createdById: alice.id,
    },
  });
  console.log(`✅ Group seeded: ${group.name}`);

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: alice.id,
        groupId: group.id,
      },
    },
    update: {
      role: "admin",
    },
    create: {
      userId: alice.id,
      groupId: group.id,
      role: "admin",
    },
  });
  console.log("✅ Group member seeded: Alice (admin)");

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: bob.id,
        groupId: group.id,
      },
    },
    update: {
      role: "member",
    },
    create: {
      userId: bob.id,
      groupId: group.id,
      role: "member",
    },
  });
  console.log("✅ Group member seeded: Bob (member)");

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: charlie.id,
        groupId: group.id,
      },
    },
    update: {
      role: "member",
    },
    create: {
      userId: charlie.id,
      groupId: group.id,
      role: "member",
    },
  });
  console.log("✅ Group member seeded: Charlie (member)");

  return group;
}

async function seedExpenses(group, alice, bob, charlie) {
  const hotel = await prisma.expense.upsert({
    where: { id: IDS.expenses.hotel },
    update: {
      title: "Hotel booking",
      amount: 3000,
      splitType: "equal",
      category: "travel",
      paidById: alice.id,
      groupId: group.id,
    },
    create: {
      id: IDS.expenses.hotel,
      title: "Hotel booking",
      amount: 3000,
      splitType: "equal",
      category: "travel",
      paidById: alice.id,
      groupId: group.id,
    },
  });
  console.log(`✅ Expense seeded: ${hotel.title} (₹${hotel.amount})`);

  await prisma.expenseShare.upsert({
    where: {
      expenseId_userId: {
        expenseId: hotel.id,
        userId: alice.id,
      },
    },
    update: { amount: 1000, percentage: null },
    create: {
      expenseId: hotel.id,
      userId: alice.id,
      amount: 1000,
    },
  });

  await prisma.expenseShare.upsert({
    where: {
      expenseId_userId: {
        expenseId: hotel.id,
        userId: bob.id,
      },
    },
    update: { amount: 1000, percentage: null },
    create: {
      expenseId: hotel.id,
      userId: bob.id,
      amount: 1000,
    },
  });

  await prisma.expenseShare.upsert({
    where: {
      expenseId_userId: {
        expenseId: hotel.id,
        userId: charlie.id,
      },
    },
    update: { amount: 1000, percentage: null },
    create: {
      expenseId: hotel.id,
      userId: charlie.id,
      amount: 1000,
    },
  });
  console.log("✅ Shares seeded for: Hotel booking");

  const dinner = await prisma.expense.upsert({
    where: { id: IDS.expenses.dinner },
    update: {
      title: "Dinner at Fisherman's Wharf",
      amount: 1500,
      splitType: "equal",
      category: "food",
      paidById: bob.id,
      groupId: group.id,
    },
    create: {
      id: IDS.expenses.dinner,
      title: "Dinner at Fisherman's Wharf",
      amount: 1500,
      splitType: "equal",
      category: "food",
      paidById: bob.id,
      groupId: group.id,
    },
  });
  console.log(`✅ Expense seeded: ${dinner.title} (₹${dinner.amount})`);

  await prisma.expenseShare.upsert({
    where: {
      expenseId_userId: {
        expenseId: dinner.id,
        userId: alice.id,
      },
    },
    update: { amount: 500, percentage: null },
    create: {
      expenseId: dinner.id,
      userId: alice.id,
      amount: 500,
    },
  });

  await prisma.expenseShare.upsert({
    where: {
      expenseId_userId: {
        expenseId: dinner.id,
        userId: bob.id,
      },
    },
    update: { amount: 500, percentage: null },
    create: {
      expenseId: dinner.id,
      userId: bob.id,
      amount: 500,
    },
  });

  await prisma.expenseShare.upsert({
    where: {
      expenseId_userId: {
        expenseId: dinner.id,
        userId: charlie.id,
      },
    },
    update: { amount: 500, percentage: null },
    create: {
      expenseId: dinner.id,
      userId: charlie.id,
      amount: 500,
    },
  });
  console.log("✅ Shares seeded for: Dinner at Fisherman's Wharf");

  const scuba = await prisma.expense.upsert({
    where: { id: IDS.expenses.scuba },
    update: {
      title: "Scuba diving",
      amount: 2400,
      splitType: "custom",
      category: "activity",
      paidById: charlie.id,
      groupId: group.id,
    },
    create: {
      id: IDS.expenses.scuba,
      title: "Scuba diving",
      amount: 2400,
      splitType: "custom",
      category: "activity",
      paidById: charlie.id,
      groupId: group.id,
    },
  });
  console.log(`✅ Expense seeded: ${scuba.title} (₹${scuba.amount})`);

  await prisma.expenseShare.upsert({
    where: {
      expenseId_userId: {
        expenseId: scuba.id,
        userId: alice.id,
      },
    },
    update: { amount: 800, percentage: null },
    create: {
      expenseId: scuba.id,
      userId: alice.id,
      amount: 800,
    },
  });

  await prisma.expenseShare.upsert({
    where: {
      expenseId_userId: {
        expenseId: scuba.id,
        userId: bob.id,
      },
    },
    update: { amount: 800, percentage: null },
    create: {
      expenseId: scuba.id,
      userId: bob.id,
      amount: 800,
    },
  });

  await prisma.expenseShare.upsert({
    where: {
      expenseId_userId: {
        expenseId: scuba.id,
        userId: charlie.id,
      },
    },
    update: { amount: 800, percentage: null },
    create: {
      expenseId: scuba.id,
      userId: charlie.id,
      amount: 800,
    },
  });
  console.log("✅ Shares seeded for: Scuba diving");
}

async function main() {
  console.log("🌱 Starting Splitora seed...");

  const { alice, bob, charlie } = await seedUsers();
  const group = await seedGroup(alice, bob, charlie);
  await seedExpenses(group, alice, bob, charlie);

  console.log("🎉 Splitora seed completed successfully");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log("🔌 Prisma disconnected");
  });

import bcrypt from "bcryptjs";
import connectDB from "../lib/db/mongoose";
import {
  User,
  Account,
  Category,
  Transaction,
  Budget,
  Room,
  RoomMember,
  SharedExpense,
  Settlement,
  RecurringTransaction,
  SavingsGoal,
  Notification,
  ActivityLog,
} from "../models";
import { subDays, addDays, format } from "date-fns";

async function createAdmin() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  const password = "Sameer";
  const passwordHash = await bcrypt.hash(password, 12);

  const emails = ["sameerkhann9412@gmail.com", "sameerkhann9412@gmail"];

  for (const email of emails) {
    console.log(`Setting up Admin account for: ${email}`);

    // Upsert user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: "Sameer Khan",
        email,
        passwordHash,
        defaultCurrency: "INR",
        timezone: "Asia/Kolkata",
        dateFormat: "dd/MM/yyyy",
        numberFormat: "en-IN",
        firstDayOfMonth: 1,
        theme: "dark",
        onboardingCompleted: true,
      });
    } else {
      user.name = "Sameer Khan";
      user.passwordHash = passwordHash;
      user.onboardingCompleted = true;
      user.isDeleted = false;
      await user.save();
    }

    // Set up accounts for this user
    await Account.deleteMany({ userId: user._id });
    const hdfcBank = await Account.create({
      userId: user._id,
      name: "HDFC Priority Salary",
      type: "BANK",
      currency: "INR",
      openingBalance: 20000000, // ₹2,00,000.00
      currentBalance: 16500000, // ₹1,65,000.00
      color: "#3b82f6",
    });

    const cashWallet = await Account.create({
      userId: user._id,
      name: "Cash Wallet",
      type: "CASH",
      currency: "INR",
      openingBalance: 1000000, // ₹10,000.00
      currentBalance: 650000, // ₹6,500.00
      color: "#10b981",
    });

    const creditCard = await Account.create({
      userId: user._id,
      name: "HDFC Regalia Gold Credit Card",
      type: "CREDIT_CARD",
      currency: "INR",
      openingBalance: 0,
      currentBalance: 2450000, // ₹24,500.00 used
      creditLimit: 50000000, // ₹5,00,000.00 limit
      statementDate: 20,
      dueDate: 10,
      color: "#f59e0b",
    });

    // Ensure categories
    const categories = await Category.find({ isSystemDefault: true });
    const catMap = new Map(categories.map((c) => [c.name, c._id]));

    // Personal transactions
    await Transaction.deleteMany({ userId: user._id });
    const now = new Date();
    await Transaction.create([
      {
        userId: user._id,
        type: "INCOME",
        amount: 22000000, // ₹2,20,000
        currency: "INR",
        accountId: hdfcBank._id,
        categoryId: catMap.get("Salary") || categories[0]._id,
        date: subDays(now, 18),
        merchant: "Global Tech Enterprise",
        description: "Monthly Executive Salary",
        tags: ["salary", "primary"],
      },
      {
        userId: user._id,
        type: "INCOME",
        amount: 4500000, // ₹45,000
        currency: "INR",
        accountId: hdfcBank._id,
        categoryId: catMap.get("Investments") || categories[0]._id,
        date: subDays(now, 10),
        merchant: "Equity Dividend",
        description: "Quarterly Investment Dividends",
        tags: ["dividends", "passive"],
      },
      {
        userId: user._id,
        type: "EXPENSE",
        amount: 4500000, // ₹45,000
        currency: "INR",
        accountId: hdfcBank._id,
        categoryId: catMap.get("Housing & Rent") || categories[0]._id,
        date: subDays(now, 20),
        merchant: "Delhi Residence",
        description: "Apartment Rent Payment",
        tags: ["rent", "essential"],
      },
      {
        userId: user._id,
        type: "EXPENSE",
        amount: 1250000, // ₹12,500
        currency: "INR",
        accountId: creditCard._id,
        categoryId: catMap.get("Groceries") || categories[0]._id,
        date: subDays(now, 7),
        merchant: "Modern Bazaar",
        description: "Monthly Groceries & Home Supplies",
        tags: ["groceries"],
      },
      {
        userId: user._id,
        type: "EXPENSE",
        amount: 620000, // ₹6,200
        currency: "INR",
        accountId: creditCard._id,
        categoryId: catMap.get("Food & Dining") || categories[0]._id,
        date: subDays(now, 3),
        merchant: "Bukhara ITC Maurya",
        description: "Family Dinner Outing",
        tags: ["dining", "social"],
      },
      {
        userId: user._id,
        type: "EXPENSE",
        amount: 250000, // ₹2,500
        currency: "INR",
        accountId: cashWallet._id,
        categoryId: catMap.get("Transport") || categories[0]._id,
        date: subDays(now, 1),
        merchant: "Fuel Station",
        description: "Vehicle Fuel Refill",
        tags: ["commute"],
      },
    ]);

    // Monthly Budget
    const currentPeriod = format(now, "yyyy-MM");
    await Budget.deleteMany({ userId: user._id });
    await Budget.create({
      userId: user._id,
      period: currentPeriod,
      overallLimit: 9500000, // ₹95,000.00
      categoryLimits: [
        { categoryId: catMap.get("Food & Dining") || categories[0]._id, limit: 1500000 },
        { categoryId: catMap.get("Groceries") || categories[0]._id, limit: 2000000 },
        { categoryId: catMap.get("Housing & Rent") || categories[0]._id, limit: 4500000 },
        { categoryId: catMap.get("Transport") || categories[0]._id, limit: 1000000 },
      ],
      alertThresholds: [50, 75, 90, 100],
    });

    // Make Sameer OWNER / ADMIN of the shared rooms
    const rooms = await Room.find({ isArchived: false });
    for (const r of rooms) {
      await RoomMember.findOneAndUpdate(
        { roomId: r._id, userId: user._id },
        { roomId: r._id, userId: user._id, role: "OWNER", joinedAt: new Date() },
        { upsert: true }
      );
    }

    // Savings Goals
    await SavingsGoal.deleteMany({ userId: user._id });
    await SavingsGoal.create([
      {
        userId: user._id,
        name: "Emergency Reserve Fund",
        targetAmount: 50000000, // ₹5,00,000
        currentAmount: 32000000, // ₹3,20,000
        targetDate: addDays(now, 150),
        color: "#10b981",
        icon: "ShieldCheck",
        isCompleted: false,
      },
      {
        userId: user._id,
        name: "New Car Down Payment",
        targetAmount: 40000000, // ₹4,00,000
        currentAmount: 28000000, // ₹2,80,000
        targetDate: addDays(now, 90),
        color: "#3b82f6",
        icon: "Car",
        isCompleted: false,
      },
    ]);

    // Recurring Bills
    await RecurringTransaction.deleteMany({ userId: user._id });
    await RecurringTransaction.create([
      {
        userId: user._id,
        type: "EXPENSE",
        amount: 4500000, // ₹45,000
        accountId: hdfcBank._id,
        categoryId: catMap.get("Housing & Rent") || categories[0]._id,
        description: "Apartment Monthly Rent",
        frequency: "MONTHLY",
        startDate: new Date("2026-01-01"),
        nextOccurrence: addDays(now, 6),
        status: "ACTIVE",
      },
      {
        userId: user._id,
        type: "EXPENSE",
        amount: 249900, // ₹2,499
        accountId: creditCard._id,
        categoryId: catMap.get("Subscriptions") || categories[0]._id,
        description: "Broadband Gigabit Fiber",
        frequency: "MONTHLY",
        startDate: new Date("2026-01-01"),
        nextOccurrence: addDays(now, 14),
        status: "ACTIVE",
      },
    ]);

    // Notifications
    await Notification.deleteMany({ userId: user._id });
    await Notification.create([
      {
        userId: user._id,
        type: "JOIN_APPROVED",
        title: "Admin Access Granted",
        message: "Your administrator account has been provisioned with full permissions.",
        link: "/dashboard",
        read: false,
      },
      {
        userId: user._id,
        type: "BUDGET_ALERT",
        title: "Budget Health Alert",
        message: "Your monthly spending is on pace and within healthy thresholds.",
        link: "/budgets",
        read: false,
      },
    ]);

    console.log(`✅ Admin account configured successfully for: ${email}`);
  }

  console.log("\n==========================================");
  console.log("🎉 ADMIN PROVISIONING COMPLETE");
  console.log("Email:    sameerkhann9412@gmail.com (or sameerkhann9412@gmail)");
  console.log("Password: Sameer");
  console.log("Role:     Admin / Room Owner");
  console.log("==========================================\n");

  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("Error creating admin:", err);
  process.exit(1);
});

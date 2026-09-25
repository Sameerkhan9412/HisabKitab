import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
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
} from "@/models";
import { format, subDays, addDays } from "date-fns";

export async function POST() {
  try {
    await connectDB();

    // Clean existing test data safely
    await Promise.all([
      User.deleteMany({ email: { $in: ["harbir@example.com", "aman@example.com", "rahul@example.com"] } }),
      Category.deleteMany({ isSystemDefault: true }),
    ]);

    const passwordHash = await bcrypt.hash("Password123!", 12);
    const sameerPasswordHash = await bcrypt.hash("Sameer", 12);

    // 1. Create Users
    const sameer = await User.create({
      name: "Sameer Khan",
      email: "sameerkhann9412@gmail.com",
      passwordHash: sameerPasswordHash,
      defaultCurrency: "INR",
      timezone: "Asia/Kolkata",
      dateFormat: "dd/MM/yyyy",
      numberFormat: "en-IN",
      firstDayOfMonth: 1,
      theme: "dark",
      onboardingCompleted: true,
    });

    const sameerAlt = await User.create({
      name: "Sameer Khan",
      email: "sameerkhann9412@gmail",
      passwordHash: sameerPasswordHash,
      defaultCurrency: "INR",
      timezone: "Asia/Kolkata",
      dateFormat: "dd/MM/yyyy",
      numberFormat: "en-IN",
      firstDayOfMonth: 1,
      theme: "dark",
      onboardingCompleted: true,
    });

    const harbir = await User.create({
      name: "Harbir Singh",
      email: "harbir@example.com",
      passwordHash,
      defaultCurrency: "INR",
      timezone: "Asia/Kolkata",
      dateFormat: "dd/MM/yyyy",
      numberFormat: "en-IN",
      firstDayOfMonth: 1,
      theme: "dark",
      onboardingCompleted: true,
    });

    const aman = await User.create({
      name: "Aman Sharma",
      email: "aman@example.com",
      passwordHash,
      defaultCurrency: "INR",
      timezone: "Asia/Kolkata",
      theme: "dark",
      onboardingCompleted: true,
    });

    const rahul = await User.create({
      name: "Rahul Verma",
      email: "rahul@example.com",
      passwordHash,
      defaultCurrency: "INR",
      timezone: "Asia/Kolkata",
      theme: "dark",
      onboardingCompleted: true,
    });

    // 2. Create Accounts for Harbir
    const hdfcBank = await Account.create({
      userId: harbir._id,
      name: "HDFC Salary Account",
      type: "BANK",
      currency: "INR",
      openingBalance: 15000000, // ₹1,50,000.00
      currentBalance: 12500000, // ₹1,25,000.00
      color: "#3b82f6",
    });

    const cashWallet = await Account.create({
      userId: harbir._id,
      name: "Cash in Wallet",
      type: "CASH",
      currency: "INR",
      openingBalance: 500000, // ₹5,000.00
      currentBalance: 320000, // ₹3,200.00
      color: "#10b981",
    });

    const iciciCard = await Account.create({
      userId: harbir._id,
      name: "ICICI Sapphiro Credit Card",
      type: "CREDIT_CARD",
      currency: "INR",
      openingBalance: 0,
      currentBalance: 1845000, // ₹18,450.00 used
      creditLimit: 30000000, // ₹3,00,000 limit
      statementDate: 15,
      dueDate: 5,
      color: "#f59e0b",
    });

    // 3. System Default Categories
    const categoriesData = [
      { name: "Food & Dining", type: "EXPENSE", icon: "Utensils", color: "#f97316" },
      { name: "Groceries", type: "EXPENSE", icon: "ShoppingCart", color: "#10b981" },
      { name: "Transport", type: "EXPENSE", icon: "Car", color: "#06b6d4" },
      { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag", color: "#ec4899" },
      { name: "Entertainment", type: "EXPENSE", icon: "Film", color: "#8b5cf6" },
      { name: "Housing & Rent", type: "EXPENSE", icon: "Home", color: "#3b82f6" },
      { name: "Utilities", type: "EXPENSE", icon: "Zap", color: "#eab308" },
      { name: "Health", type: "EXPENSE", icon: "HeartPulse", color: "#ef4444" },
      { name: "Subscriptions", type: "EXPENSE", icon: "Repeat", color: "#a855f7" },
      { name: "Salary", type: "INCOME", icon: "Briefcase", color: "#10b981" },
      { name: "Freelance", type: "INCOME", icon: "Laptop", color: "#06b6d4" },
      { name: "Investments", type: "INCOME", icon: "TrendingUp", color: "#3b82f6" },
    ];

    const seededCategories = await Category.insertMany(
      categoriesData.map((c) => ({ ...c, isSystemDefault: true, userId: null }))
    );

    const catMap = new Map(seededCategories.map((c) => [c.name, c._id]));

    // 4. Seed Personal Transactions for Harbir
    const now = new Date();
    await Transaction.create([
      {
        userId: harbir._id,
        type: "INCOME",
        amount: 15000000, // ₹1,50,000
        currency: "INR",
        accountId: hdfcBank._id,
        categoryId: catMap.get("Salary"),
        date: subDays(now, 20),
        merchant: "Tech Corp Global",
        description: "Monthly Consulting Salary",
        tags: ["salary", "primary"],
      },
      {
        userId: harbir._id,
        type: "INCOME",
        amount: 3500000, // ₹35,000
        currency: "INR",
        accountId: hdfcBank._id,
        categoryId: catMap.get("Freelance"),
        date: subDays(now, 10),
        merchant: "Client Project Delhi",
        description: "Full Stack UI/UX Project Milestone",
        tags: ["freelance"],
      },
      {
        userId: harbir._id,
        type: "EXPENSE",
        amount: 3500000, // ₹35,000
        currency: "INR",
        accountId: hdfcBank._id,
        categoryId: catMap.get("Housing & Rent"),
        date: subDays(now, 22),
        merchant: "Landlord Delhi",
        description: "Apartment Rent - South Extension",
        tags: ["rent", "essential"],
      },
      {
        userId: harbir._id,
        type: "EXPENSE",
        amount: 850000, // ₹8,500
        currency: "INR",
        accountId: iciciCard._id,
        categoryId: catMap.get("Groceries"),
        date: subDays(now, 8),
        merchant: "Nature's Basket",
        description: "Monthly Organic Groceries & Pantry Restock",
        tags: ["groceries"],
      },
      {
        userId: harbir._id,
        type: "EXPENSE",
        amount: 420000, // ₹4,200
        currency: "INR",
        accountId: iciciCard._id,
        categoryId: catMap.get("Food & Dining"),
        date: subDays(now, 4),
        merchant: "Olive Bar & Kitchen",
        description: "Weekend Team Dinner",
        tags: ["dining", "social"],
      },
      {
        userId: harbir._id,
        type: "EXPENSE",
        amount: 180000, // ₹1,800
        currency: "INR",
        accountId: cashWallet._id,
        categoryId: catMap.get("Transport"),
        date: subDays(now, 2),
        merchant: "Uber India",
        description: "Airport Commute Cab Ride",
        tags: ["commute"],
      },
      {
        userId: harbir._id,
        type: "EXPENSE",
        amount: 149900, // ₹1,499
        currency: "INR",
        accountId: iciciCard._id,
        categoryId: catMap.get("Subscriptions"),
        date: subDays(now, 1),
        merchant: "Netflix & Spotify",
        description: "Entertainment Streaming Subscriptions",
        tags: ["entertainment"],
      },
    ]);

    // 5. Seed Monthly Budget for Harbir
    const currentPeriod = format(now, "yyyy-MM");
    await Budget.create({
      userId: harbir._id,
      period: currentPeriod,
      overallLimit: 7500000, // ₹75,000.00
      categoryLimits: [
        { categoryId: catMap.get("Food & Dining"), limit: 1200000 },
        { categoryId: catMap.get("Groceries"), limit: 1500000 },
        { categoryId: catMap.get("Housing & Rent"), limit: 3500000 },
        { categoryId: catMap.get("Transport"), limit: 600000 },
        { categoryId: catMap.get("Entertainment"), limit: 700000 },
      ],
      alertThresholds: [50, 75, 90, 100],
    });

    // 6. Create Shared Rooms
    const goaRoom = await Room.create({
      name: "Goa Beach Trip 2026",
      description: "Weekend getaway expenses, villa booking, dining & scooter rentals",
      icon: "Palmtree",
      currency: "INR",
      createdBy: harbir._id,
      inviteCode: "GOATRIP1",
    });

    const flatRoom = await Room.create({
      name: "Flat 402 - Delhi",
      description: "Apartment utilities, cook salary, wifi, and shared groceries",
      icon: "Home",
      currency: "INR",
      createdBy: harbir._id,
      inviteCode: "FLAT402X",
    });

    // Seed Memberships
    await RoomMember.create([
      { roomId: goaRoom._id, userId: sameer._id, role: "OWNER" },
      { roomId: goaRoom._id, userId: harbir._id, role: "ADMIN" },
      { roomId: goaRoom._id, userId: aman._id, role: "MEMBER" },
      { roomId: goaRoom._id, userId: rahul._id, role: "MEMBER" },

      { roomId: flatRoom._id, userId: sameer._id, role: "OWNER" },
      { roomId: flatRoom._id, userId: harbir._id, role: "ADMIN" },
      { roomId: flatRoom._id, userId: aman._id, role: "ADMIN" },
    ]);

    // 7. Seed Shared Expenses for Goa Room
    // Dinner = ₹3,000 paid by Harbir, split equally (₹1,000 each)
    await SharedExpense.create({
      roomId: goaRoom._id,
      title: "Seafood Shack Beach Dinner",
      amount: 300000, // ₹3,000
      currency: "INR",
      date: subDays(now, 5),
      categoryId: catMap.get("Food & Dining"),
      splitType: "EQUAL",
      payers: [{ userId: harbir._id, amount: 300000 }],
      splits: [
        { userId: harbir._id, amount: 100000 },
        { userId: aman._id, amount: 100000 },
        { userId: rahul._id, amount: 100000 },
      ],
      notes: "Dinner at Thalassa Anjuna",
      createdBy: harbir._id,
    });

    // Hotel Villa = ₹12,000 (Harbir paid 8,000, Aman paid 4,000, split equally: 4,000 each)
    await SharedExpense.create({
      roomId: goaRoom._id,
      title: "Luxury Beach Villa Stay (2 Nights)",
      amount: 1200000, // ₹12,000
      currency: "INR",
      date: subDays(now, 4),
      categoryId: catMap.get("Housing & Rent"),
      splitType: "EQUAL",
      payers: [
        { userId: harbir._id, amount: 800000 },
        { userId: aman._id, amount: 400000 },
      ],
      splits: [
        { userId: harbir._id, amount: 400000 },
        { userId: aman._id, amount: 400000 },
        { userId: rahul._id, amount: 400000 },
      ],
      notes: "North Goa 3BHK Villa Booking with private pool",
      createdBy: harbir._id,
    });

    // 8. Seed Settlements (Aman settled ₹1,000 with Harbir via UPI)
    await Settlement.create({
      roomId: goaRoom._id,
      fromUserId: aman._id,
      toUserId: harbir._id,
      amount: 100000, // ₹1,000
      currency: "INR",
      method: "UPI",
      date: subDays(now, 3),
      notes: "Settled dinner share via GPay",
      recordedBy: aman._id,
    });

    // 9. Seed Savings Goals
    await SavingsGoal.create([
      {
        userId: harbir._id,
        name: "Emergency Fund (6 Months)",
        targetAmount: 30000000, // ₹3,00,000
        currentAmount: 18500000, // ₹1,85,000
        targetDate: addDays(now, 180),
        color: "#10b981",
        icon: "ShieldAlert",
        isCompleted: false,
      },
      {
        userId: harbir._id,
        name: "MacBook Pro M3 Max",
        targetAmount: 25000000, // ₹2,50,000
        currentAmount: 17500000, // ₹1,75,000
        targetDate: addDays(now, 60),
        color: "#6366f1",
        icon: "Laptop",
        isCompleted: false,
      },
    ]);

    // 10. Seed Recurring Bills
    await RecurringTransaction.create([
      {
        userId: harbir._id,
        type: "EXPENSE",
        amount: 3500000, // ₹35,000
        accountId: hdfcBank._id,
        categoryId: catMap.get("Housing & Rent"),
        description: "Apartment Monthly Rent",
        frequency: "MONTHLY",
        startDate: new Date("2026-01-01"),
        nextOccurrence: addDays(now, 5),
        status: "ACTIVE",
      },
      {
        userId: harbir._id,
        type: "EXPENSE",
        amount: 199900, // ₹1,999
        accountId: iciciCard._id,
        categoryId: catMap.get("Utilities"),
        description: "Airtel Xstream Fiber 300Mbps",
        frequency: "MONTHLY",
        startDate: new Date("2026-01-01"),
        nextOccurrence: addDays(now, 12),
        status: "ACTIVE",
      },
    ]);

    // 11. Seed Notifications
    await Notification.create([
      {
        userId: harbir._id,
        type: "SETTLEMENT_RECORDED",
        title: "Settlement Received",
        message: "Aman Sharma recorded a settlement of ₹1,000.00 via UPI in 'Goa Beach Trip 2026'",
        link: `/rooms/${goaRoom._id}`,
        read: false,
      },
      {
        userId: harbir._id,
        type: "BUDGET_ALERT",
        title: "Budget Threshold Notice",
        message: "Your Dining & Food budget has reached 70% of its monthly limit.",
        link: "/budgets",
        read: true,
      },
    ]);

    // 12. Seed Activity Logs
    await ActivityLog.create([
      {
        roomId: goaRoom._id,
        userId: harbir._id,
        action: "EXPENSE_CREATED",
        details: { title: "Luxury Beach Villa Stay", amount: 1200000 },
      },
      {
        roomId: goaRoom._id,
        userId: aman._id,
        action: "SETTLEMENT_RECORDED",
        details: { from: "Aman Sharma", to: "Harbir Singh", amount: 100000 },
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with rich realistic test data!",
      credentials: [
        { email: "sameerkhann9412@gmail.com", password: "Sameer", role: "Primary Administrator / Owner" },
        { email: "harbir@example.com", password: "Password123!", role: "Room Admin" },
        { email: "aman@example.com", password: "Password123!", role: "Room Member / Admin" },
        { email: "rahul@example.com", password: "Password123!", role: "Room Member" },
      ],
    });
  } catch (error: unknown) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

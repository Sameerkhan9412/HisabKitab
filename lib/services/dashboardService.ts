import mongoose from "mongoose";
import connectDB from "@/lib/db/mongoose";
import { Transaction, Budget, Account, SharedExpense, Settlement, RoomMember, RecurringTransaction } from "@/models";
import { startOfMonth, endOfMonth, subDays, format } from "date-fns";

export async function getDashboardData(userId: string) {
  await connectDB();
  const uId = new mongoose.Types.ObjectId(userId);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const currentPeriod = format(now, "yyyy-MM");

  // 1. Account Total Balances
  const accounts = await Account.find({ userId: uId, isArchived: false }).lean();
  const totalBalance = accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);

  // 2. Monthly Income, Expenses & Net Cashflow via Mongo Aggregation
  const monthlyStats = await Transaction.aggregate([
    {
      $match: {
        userId: uId,
        isDeleted: false,
        date: { $gte: monthStart, $lte: monthEnd },
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const stat of monthlyStats) {
    if (stat._id === "INCOME") totalIncome = stat.total;
    if (stat._id === "EXPENSE") totalExpenses = stat.total;
  }

  const monthlySavings = Math.max(0, totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? Math.round((monthlySavings / totalIncome) * 100) : 0;

  // 3. Current Budget & Usage
  const currentBudget = await Budget.findOne({ userId: uId, period: currentPeriod }).populate("categoryLimits.categoryId").lean();
  const overallBudgetLimit = currentBudget?.overallLimit || 0;
  const remainingBudget = Math.max(0, overallBudgetLimit - totalExpenses);
  const budgetConsumedPercent = overallBudgetLimit > 0 ? Math.min(100, Math.round((totalExpenses / overallBudgetLimit) * 100)) : 0;

  // 4. Category Spending Breakdown for current month
  const categoryBreakdown = await Transaction.aggregate([
    {
      $match: {
        userId: uId,
        type: "EXPENSE",
        isDeleted: false,
        date: { $gte: monthStart, $lte: monthEnd },
      },
    },
    {
      $group: {
        _id: "$categoryId",
        total: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        categoryId: "$_id",
        name: "$category.name",
        color: "$category.color",
        icon: "$category.icon",
        amount: "$total",
      },
    },
    { $sort: { amount: -1 } },
  ]);

  // 5. Shared Room Balances for User (Amounts user owes vs amounts owed to user)
  const userMemberships = await RoomMember.find({ userId: uId }).lean();
  const roomIds = userMemberships.map((m) => m.roomId);

  let amountOwedToMe = 0;
  let amountIOweOthers = 0;

  if (roomIds.length > 0) {
    const roomExpenses = await SharedExpense.find({ roomId: { $in: roomIds } }).lean();
    const roomSettlements = await Settlement.find({ roomId: { $in: roomIds } }).lean();

    // Calculate user's net position across rooms
    for (const exp of roomExpenses) {
      const payer = exp.payers.find((p) => p.userId.toString() === userId);
      if (payer) {
        amountOwedToMe += payer.amount;
      }

      const split = exp.splits.find((s) => s.userId.toString() === userId);
      if (split) {
        amountIOweOthers += split.amount;
      }
    }

    for (const st of roomSettlements) {
      if (st.fromUserId.toString() === userId) {
        // User paid settlement -> reduces what they owe
        amountIOweOthers -= st.amount;
      }
      if (st.toUserId.toString() === userId) {
        // User received settlement -> reduces what others owe them
        amountOwedToMe -= st.amount;
      }
    }
  }

  const netShared = amountOwedToMe - amountIOweOthers;
  const normalizedOwedToMe = netShared > 0 ? netShared : 0;
  const normalizedIOwe = netShared < 0 ? Math.abs(netShared) : 0;

  // 6. 30-Day Spending Trend (Daily points)
  const thirtyDaysAgo = subDays(now, 30);
  const dailyTransactions = await Transaction.aggregate([
    {
      $match: {
        userId: uId,
        isDeleted: false,
        date: { $gte: thirtyDaysAgo, $lte: now },
      },
    },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.day": 1 } },
  ]);

  // Transform daily trend into day-by-day mapping
  const trendMap: Record<string, { date: string; income: number; expense: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const dStr = format(subDays(now, i), "yyyy-MM-dd");
    trendMap[dStr] = { date: format(subDays(now, i), "dd MMM"), income: 0, expense: 0 };
  }

  for (const item of dailyTransactions) {
    const dayKey = item._id.day;
    if (trendMap[dayKey]) {
      if (item._id.type === "INCOME") trendMap[dayKey].income = item.total / 100;
      if (item._id.type === "EXPENSE") trendMap[dayKey].expense = item.total / 100;
    }
  }

  // 7. Recent Transactions (last 6)
  const recentTransactions = await Transaction.find({ userId: uId, isDeleted: false })
    .sort({ date: -1 })
    .limit(6)
    .populate("categoryId", "name icon color")
    .populate("accountId", "name type color")
    .lean();

  // 8. Upcoming Recurring Bills / Subscriptions
  const upcomingBills = await RecurringTransaction.find({
    userId: uId,
    status: "ACTIVE",
  })
    .sort({ nextOccurrence: 1 })
    .limit(5)
    .populate("categoryId", "name icon color")
    .lean();

  return {
    kpis: {
      totalBalance,
      totalIncome,
      totalExpenses,
      overallBudgetLimit,
      remainingBudget,
      budgetConsumedPercent,
      monthlySavings,
      savingsRate,
      owedToMe: normalizedOwedToMe,
      iOwe: normalizedIOwe,
      activeRoomsCount: roomIds.length,
    },
    spendingTrend: Object.values(trendMap),
    categoryBreakdown,
    recentTransactions: JSON.parse(JSON.stringify(recentTransactions)),
    upcomingBills: JSON.parse(JSON.stringify(upcomingBills)),
  };
}

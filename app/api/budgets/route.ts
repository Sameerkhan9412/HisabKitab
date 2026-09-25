import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Budget, Transaction } from "@/models";
import { BudgetSchema } from "@/lib/validations";
import { toMinorUnits } from "@/lib/utils";
import { parse, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || format(new Date(), "yyyy-MM");

    const parsedMonth = parse(period, "yyyy-MM", new Date());
    const mStart = startOfMonth(parsedMonth);
    const mEnd = endOfMonth(parsedMonth);

    const budget = await Budget.findOne({
      userId: session.user.id,
      period,
    })
      .populate("categoryLimits.categoryId")
      .lean();

    // Compute actual spending in this period
    const spendingAgg = await Transaction.aggregate([
      {
        $match: {
          userId: new (await import("mongoose")).Types.ObjectId(session.user.id),
          type: "EXPENSE",
          isDeleted: false,
          date: { $gte: mStart, $lte: mEnd },
        },
      },
      {
        $group: {
          _id: "$categoryId",
          spent: { $sum: "$amount" },
        },
      },
    ]);

    const spentByCategory: Record<string, number> = {};
    let totalSpent = 0;
    for (const item of spendingAgg) {
      const catId = item._id.toString();
      spentByCategory[catId] = item.spent;
      totalSpent += item.spent;
    }

    return NextResponse.json({
      period,
      budget,
      totalSpent,
      spentByCategory,
    });
  } catch (error: unknown) {
    console.error("Budget fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = BudgetSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { period, overallLimit, categoryLimits, alertThresholds } = validated.data;

    await connectDB();

    const minorOverall = toMinorUnits(overallLimit);
    const minorCategoryLimits = categoryLimits.map((c) => ({
      categoryId: c.categoryId,
      limit: toMinorUnits(c.limit),
      rollover: c.rollover ?? false,
    }));

    const budget = await Budget.findOneAndUpdate(
      { userId: session.user.id, period },
      {
        userId: session.user.id,
        period,
        overallLimit: minorOverall,
        categoryLimits: minorCategoryLimits,
        alertThresholds,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ budget }, { status: 200 });
  } catch (error: unknown) {
    console.error("Budget save error:", error);
    return NextResponse.json({ error: "Failed to save budget" }, { status: 500 });
  }
}

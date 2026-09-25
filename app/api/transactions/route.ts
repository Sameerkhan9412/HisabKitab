import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Transaction, Account } from "@/models";
import { TransactionSchema } from "@/lib/validations";
import { toMinorUnits } from "@/lib/utils";
import mongoose from "mongoose";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {
      userId: session.user.id,
      isDeleted: false,
    };

    if (type && ["EXPENSE", "INCOME", "TRANSFER"].includes(type)) {
      query.type = type;
    }
    if (accountId) {
      query.$or = [{ accountId }, { toAccountId: accountId }];
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (query.date as Record<string, unknown>).$lte = new Date(endDate);
    }
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { description: regex },
        { merchant: regex },
        { notes: regex },
        { tags: regex },
      ];
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name icon color type")
      .populate("accountId", "name type color currency")
      .populate("toAccountId", "name type color currency")
      .lean();

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = TransactionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      type,
      amount,
      currency,
      accountId,
      toAccountId,
      categoryId,
      subCategory,
      date,
      merchant,
      description,
      notes,
      tags,
      receiptUrl,
      isRecurring,
    } = validated.data;

    if (type === "TRANSFER" && (!toAccountId || toAccountId === accountId)) {
      return NextResponse.json(
        { error: "A different destination account is required for transfers" },
        { status: 400 }
      );
    }

    const minorAmount = toMinorUnits(amount);

    await connectDB();

    // Verify account ownership
    const sourceAccount = await Account.findOne({ _id: accountId, userId: session.user.id });
    if (!sourceAccount) {
      return NextResponse.json({ error: "Source account not found" }, { status: 404 });
    }

    let destinationAccount = null;
    if (type === "TRANSFER" && toAccountId) {
      destinationAccount = await Account.findOne({ _id: toAccountId, userId: session.user.id });
      if (!destinationAccount) {
        return NextResponse.json({ error: "Destination account not found" }, { status: 404 });
      }
    }

    // Atomic session or safe sequential write
    const transaction = await Transaction.create({
      userId: session.user.id,
      type,
      amount: minorAmount,
      currency: currency || sourceAccount.currency || "INR",
      accountId,
      toAccountId: type === "TRANSFER" ? toAccountId : undefined,
      categoryId,
      subCategory,
      date: new Date(date),
      merchant,
      description,
      notes,
      tags,
      receiptUrl,
      isRecurring,
      isDeleted: false,
    });

    // Update account balances according to authoritative accounting rules
    if (type === "EXPENSE") {
      sourceAccount.currentBalance -= minorAmount;
      await sourceAccount.save();
    } else if (type === "INCOME") {
      sourceAccount.currentBalance += minorAmount;
      await sourceAccount.save();
    } else if (type === "TRANSFER" && destinationAccount) {
      sourceAccount.currentBalance -= minorAmount;
      destinationAccount.currentBalance += minorAmount;
      await sourceAccount.save();
      await destinationAccount.save();
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}

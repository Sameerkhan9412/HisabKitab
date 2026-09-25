import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Transaction, Account } from "@/models";
import { toMinorUnits } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const transaction = await Transaction.findOne({
    _id: params.id,
    userId: session.user.id,
    isDeleted: false,
  })
    .populate("categoryId")
    .populate("accountId")
    .populate("toAccountId")
    .lean();

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({ transaction });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const transaction = await Transaction.findOne({
      _id: params.id,
      userId: session.user.id,
      isDeleted: false,
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Reversal of balance changes
    if (transaction.type === "EXPENSE") {
      await Account.updateOne(
        { _id: transaction.accountId },
        { $inc: { currentBalance: transaction.amount } }
      );
    } else if (transaction.type === "INCOME") {
      await Account.updateOne(
        { _id: transaction.accountId },
        { $inc: { currentBalance: -transaction.amount } }
      );
    } else if (transaction.type === "TRANSFER" && transaction.toAccountId) {
      await Account.updateOne(
        { _id: transaction.accountId },
        { $inc: { currentBalance: transaction.amount } }
      );
      await Account.updateOne(
        { _id: transaction.toAccountId },
        { $inc: { currentBalance: -transaction.amount } }
      );
    }

    transaction.isDeleted = true;
    await transaction.save();

    return NextResponse.json({ message: "Transaction deleted and balance reconciled" });
  } catch (error: unknown) {
    console.error("Delete transaction error:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}

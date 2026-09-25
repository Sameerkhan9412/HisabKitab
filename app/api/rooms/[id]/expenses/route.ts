import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { SharedExpense, RoomMember, ActivityLog, Notification, Room } from "@/models";
import { SharedExpenseSchema } from "@/lib/validations";
import { toMinorUnits } from "@/lib/utils";
import { calculateSplits } from "@/lib/services/splitEngine";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const roomId = params.id;
    const body = await req.json();

    const validated = SharedExpenseSchema.safeParse({ ...body, roomId });
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, amount, currency, date, categoryId, splitType, payers, splits, notes, receiptUrl } =
      validated.data;

    await connectDB();

    // Verify membership
    const membership = await RoomMember.findOne({ roomId, userId: session.user.id });
    if (!membership) {
      return NextResponse.json({ error: "You are not a member of this room" }, { status: 403 });
    }

    const totalMinor = toMinorUnits(amount);

    // 1. Process Payers
    let payersTotal = 0;
    const processedPayers = payers.map((p) => {
      const pMinor = toMinorUnits(p.amount);
      payersTotal += pMinor;
      return {
        userId: p.userId,
        amount: pMinor,
      };
    });

    if (payersTotal !== totalMinor) {
      return NextResponse.json(
        {
          error: `Sum of paid amounts (${(payersTotal / 100).toFixed(2)}) must equal total expense amount (${(totalMinor / 100).toFixed(2)})`,
        },
        { status: 400 }
      );
    }

    // 2. Process Splits using our robust integer minor unit Split Engine
    const splitInputs = splits.map((s) => ({
      userId: s.userId,
      amount: s.amount !== undefined ? toMinorUnits(s.amount) : undefined,
      percentage: s.percentage,
      shares: s.shares,
    }));

    const calculatedSplits = calculateSplits(splitType, totalMinor, splitInputs);

    // 3. Create Shared Expense Document
    const expense = await SharedExpense.create({
      roomId,
      title: title.trim(),
      amount: totalMinor,
      currency: currency || "INR",
      date: new Date(date),
      categoryId: categoryId || undefined,
      splitType,
      payers: processedPayers,
      splits: calculatedSplits,
      notes: notes?.trim(),
      receiptUrl,
      createdBy: session.user.id,
      isSettled: false,
    });

    // 4. Audit Log
    const room = await Room.findById(roomId);
    await ActivityLog.create({
      roomId,
      userId: session.user.id,
      action: "EXPENSE_CREATED",
      details: {
        title,
        amount: totalMinor,
        payerCount: processedPayers.length,
        splitCount: calculatedSplits.length,
      },
    });

    // 5. Notify all other room members
    const allMembers = await RoomMember.find({ roomId, userId: { $ne: session.user.id } });
    for (const mem of allMembers) {
      await Notification.create({
        userId: mem.userId,
        type: "EXPENSE_ADDED",
        title: "New Shared Expense",
        message: `${session.user.name || "A member"} added "${title}" (₹${(totalMinor / 100).toFixed(2)}) to ${room?.name || "the room"}`,
        link: `/rooms/${roomId}`,
      });
    }

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create shared expense error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create shared expense";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

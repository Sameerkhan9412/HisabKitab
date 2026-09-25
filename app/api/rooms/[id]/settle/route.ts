import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Settlement, RoomMember, ActivityLog, Notification, Room, User } from "@/models";
import { SettlementSchema } from "@/lib/validations";
import { toMinorUnits } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const roomId = params.id;
    const body = await req.json();

    const validated = SettlementSchema.safeParse({ ...body, roomId });
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fromUserId, toUserId, amount, currency, method, date, notes } = validated.data;

    if (fromUserId === toUserId) {
      return NextResponse.json({ error: "Cannot settle balance with oneself" }, { status: 400 });
    }

    await connectDB();

    // Verify room membership
    const [fromMember, toMember] = await Promise.all([
      RoomMember.findOne({ roomId, userId: fromUserId }),
      RoomMember.findOne({ roomId, userId: toUserId }),
    ]);

    if (!fromMember || !toMember) {
      return NextResponse.json(
        { error: "Both parties must be members of this room to record a settlement" },
        { status: 400 }
      );
    }

    const minorAmount = toMinorUnits(amount);

    const settlement = await Settlement.create({
      roomId,
      fromUserId,
      toUserId,
      amount: minorAmount,
      currency: currency || "INR",
      method,
      date: new Date(date),
      notes: notes?.trim(),
      recordedBy: session.user.id,
    });

    const [fromUser, toUser, room] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId),
      Room.findById(roomId),
    ]);

    // Audit Log
    await ActivityLog.create({
      roomId,
      userId: session.user.id,
      action: "SETTLEMENT_RECORDED",
      details: {
        from: fromUser?.name,
        to: toUser?.name,
        amount: minorAmount,
        method,
      },
    });

    // Notify the other party if not recorded by them
    const notifyTarget = session.user.id === fromUserId ? toUserId : fromUserId;
    await Notification.create({
      userId: notifyTarget,
      type: "SETTLEMENT_RECORDED",
      title: "Settlement Recorded",
      message: `${session.user.name} recorded a settlement of ₹${(minorAmount / 100).toFixed(2)} (${method}) in "${room?.name || "Room"}"`,
      link: `/rooms/${roomId}`,
    });

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create settlement error:", error);
    return NextResponse.json({ error: "Failed to record settlement" }, { status: 500 });
  }
}

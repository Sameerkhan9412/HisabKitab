import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Room, RoomMember, SharedExpense, Settlement, ActivityLog } from "@/models";
import { calculateNetBalances, simplifyDebts } from "@/lib/services/splitEngine";
import { generateRandomCode } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const roomId = params.id;

    // Check membership
    const membership = await RoomMember.findOne({ roomId, userId: session.user.id });
    if (!membership) {
      return NextResponse.json({ error: "You are not a member of this room" }, { status: 403 });
    }

    const room = await Room.findById(roomId).lean();
    if (!room || room.isArchived) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Fetch members with user data
    const members = await RoomMember.find({ roomId })
      .populate("userId", "name email avatarUrl defaultCurrency")
      .lean();

    // Fetch expenses
    const expenses = await SharedExpense.find({ roomId })
      .sort({ date: -1, createdAt: -1 })
      .populate("payers.userId", "name email avatarUrl")
      .populate("splits.userId", "name email avatarUrl")
      .populate("createdBy", "name email")
      .populate("categoryId", "name icon color")
      .lean();

    // Fetch settlements
    const settlements = await Settlement.find({ roomId })
      .sort({ date: -1, createdAt: -1 })
      .populate("fromUserId", "name email avatarUrl")
      .populate("toUserId", "name email avatarUrl")
      .populate("recordedBy", "name email")
      .lean();

    // Fetch recent activity
    const activityLogs = await ActivityLog.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "name email")
      .lean();

    // Calculate Balances & Debt Simplification
    const memberIds = members.map((m) => {
      const u = m.userId as unknown as { _id: { toString(): string } };
      return u._id.toString();
    });

    const userNames: Record<string, string> = {};
    for (const m of members) {
      const u = m.userId as unknown as { _id: { toString(): string }; name: string };
      userNames[u._id.toString()] = u.name || "Member";
    }

    const rawNetBalances = calculateNetBalances(memberIds, expenses, settlements);
    const simplifiedDebts = simplifyDebts(rawNetBalances, userNames);

    return NextResponse.json({
      room,
      currentUserRole: membership.role,
      members,
      expenses,
      settlements,
      netBalances: rawNetBalances,
      simplifiedDebts,
      activityLogs,
    });
  } catch (error: unknown) {
    console.error("Room details fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch room details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const roomId = params.id;

    // Check if user is OWNER or ADMIN
    const membership = await RoomMember.findOne({ roomId, userId: session.user.id });
    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Only room owners or admins can update settings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, icon, regenerateInviteCode } = body;

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (name) room.name = name.trim();
    if (description !== undefined) room.description = description.trim();
    if (icon) room.icon = icon;
    if (regenerateInviteCode) {
      room.inviteCode = generateRandomCode(8);
    }

    await room.save();

    await ActivityLog.create({
      roomId: room._id,
      userId: session.user.id,
      action: "ROOM_UPDATED",
      details: { name: room.name },
    });

    return NextResponse.json({ room });
  } catch (error: unknown) {
    console.error("Room update error:", error);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const roomId = params.id;

    const membership = await RoomMember.findOne({ roomId, userId: session.user.id });
    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    // Verify financial integrity: check if user has outstanding balance
    const expenses = await SharedExpense.find({ roomId }).lean();
    const settlements = await Settlement.find({ roomId }).lean();
    const allMembers = await RoomMember.find({ roomId }).lean();
    const memberIds = allMembers.map((m) => m.userId.toString());

    const balances = calculateNetBalances(memberIds, expenses, settlements);
    const userNet = balances[session.user.id] || 0;

    if (userNet !== 0) {
      const formatted = (Math.abs(userNet) / 100).toFixed(2);
      const msg =
        userNet > 0
          ? `You cannot leave while you are still owed ₹${formatted}. Settle up before leaving.`
          : `You cannot leave while you still owe ₹${formatted}. Please settle your balance first.`;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (membership.role === "OWNER") {
      const remainingCount = await RoomMember.countDocuments({
        roomId,
        userId: { $ne: session.user.id },
      });
      if (remainingCount > 0) {
        return NextResponse.json(
          { error: "Room owners must transfer ownership to another member before leaving." },
          { status: 400 }
        );
      }
      // If owner is the only member, archive room
      await Room.updateOne({ _id: roomId }, { isArchived: true });
    }

    await RoomMember.deleteOne({ _id: membership._id });

    await ActivityLog.create({
      roomId,
      userId: session.user.id,
      action: "MEMBER_LEFT",
      details: { memberName: session.user.name },
    });

    return NextResponse.json({ message: "Left room successfully" });
  } catch (error: unknown) {
    console.error("Leave room error:", error);
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 });
  }
}

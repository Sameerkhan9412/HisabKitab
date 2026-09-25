import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Room, RoomMember, ActivityLog, Notification } from "@/models";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    await connectDB();

    const room = await Room.findOne({ inviteCode: cleanCode, isArchived: false });
    if (!room) {
      return NextResponse.json({ error: "Invalid or expired room invite code" }, { status: 404 });
    }

    // Check if already a member
    const existing = await RoomMember.findOne({
      roomId: room._id,
      userId: session.user.id,
    });

    if (existing) {
      return NextResponse.json(
        { message: "You are already a member of this room", roomId: room._id },
        { status: 200 }
      );
    }

    // Add membership
    const membership = await RoomMember.create({
      roomId: room._id,
      userId: session.user.id,
      role: "MEMBER",
      joinedAt: new Date(),
    });

    // Record activity
    await ActivityLog.create({
      roomId: room._id,
      userId: session.user.id,
      action: "MEMBER_JOINED",
      details: { memberName: session.user.name },
    });

    // Notify room owner
    await Notification.create({
      userId: room.createdBy,
      type: "JOIN_APPROVED",
      title: "New Member Joined",
      message: `${session.user.name || "A new user"} joined "${room.name}" via invite code`,
      link: `/rooms/${room._id}`,
    });

    return NextResponse.json({
      message: `Successfully joined "${room.name}"`,
      room,
      membership,
    });
  } catch (error: unknown) {
    console.error("Join room error:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}

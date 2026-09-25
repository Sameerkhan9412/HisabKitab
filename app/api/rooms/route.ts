import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Room, RoomMember, SharedExpense, Settlement } from "@/models";
import { RoomSchema } from "@/lib/validations";
import { generateRandomCode } from "@/lib/utils";
import { calculateNetBalances } from "@/lib/services/splitEngine";
import mongoose from "mongoose";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const uId = new mongoose.Types.ObjectId(session.user.id);

    // Get all memberships for user
    const memberships = await RoomMember.find({ userId: uId }).lean();
    const roomIds = memberships.map((m) => m.roomId);

    if (roomIds.length === 0) {
      return NextResponse.json({ rooms: [] });
    }

    const rooms = await Room.find({ _id: { $in: roomIds }, isArchived: false })
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch members counts & net balance per room for the user
    const roomData = await Promise.all(
      rooms.map(async (room) => {
        const memRecord = memberships.find((m) => m.roomId.toString() === room._id.toString());
        const memberCount = await RoomMember.countDocuments({ roomId: room._id });

        // Calculate user net balance in this room
        const expenses = await SharedExpense.find({ roomId: room._id }).lean();
        const settlements = await Settlement.find({ roomId: room._id }).lean();
        const allMembers = await RoomMember.find({ roomId: room._id }).lean();
        const memberIds = allMembers.map((m) => m.userId.toString());

        const balances = calculateNetBalances(memberIds, expenses, settlements);
        const userNet = balances[session.user.id] || 0;

        return {
          ...room,
          userRole: memRecord?.role || "MEMBER",
          memberCount,
          userNetBalance: userNet,
        };
      })
    );

    return NextResponse.json({ rooms: roomData });
  } catch (error: unknown) {
    console.error("Fetch rooms error:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = RoomSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, icon, currency } = validated.data;
    await connectDB();

    const inviteCode = generateRandomCode(8);

    const room = await Room.create({
      name,
      description,
      icon: icon || "Users",
      currency: currency || session.user.defaultCurrency || "INR",
      createdBy: session.user.id,
      inviteCode,
      isArchived: false,
    });

    // Create RoomMember as OWNER
    await RoomMember.create({
      roomId: room._id,
      userId: session.user.id,
      role: "OWNER",
      joinedAt: new Date(),
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create room error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

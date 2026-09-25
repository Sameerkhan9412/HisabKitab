import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Notification } from "@/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const notifications = await Notification.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const unreadCount = await Notification.countDocuments({
    userId: session.user.id,
    read: false,
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notificationId, markAll } = await req.json();
    await connectDB();

    if (markAll) {
      await Notification.updateMany({ userId: session.user.id, read: false }, { read: true });
    } else if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, userId: session.user.id },
        { read: true }
      );
    }

    return NextResponse.json({ message: "Notifications updated" });
  } catch (error: unknown) {
    console.error("Update notifications error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

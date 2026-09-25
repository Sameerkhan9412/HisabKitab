import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { User } from "@/models";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user || user.isDeleted) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      avatarUrl,
      defaultCurrency,
      timezone,
      dateFormat,
      numberFormat,
      firstDayOfMonth,
      theme,
      onboardingCompleted,
      currentPassword,
      newPassword,
    } = body;

    await connectDB();
    const user = await User.findById(session.user.id).select("+passwordHash");
    if (!user || user.isDeleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (name) user.name = name.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (defaultCurrency) user.defaultCurrency = defaultCurrency;
    if (timezone) user.timezone = timezone;
    if (dateFormat) user.dateFormat = dateFormat;
    if (numberFormat) user.numberFormat = numberFormat;
    if (firstDayOfMonth) user.firstDayOfMonth = firstDayOfMonth;
    if (theme) user.theme = theme;
    if (onboardingCompleted !== undefined) user.onboardingCompleted = onboardingCompleted;

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash || "");
      if (!isMatch) {
        return NextResponse.json({ error: "Current password does not match" }, { status: 400 });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        defaultCurrency: user.defaultCurrency,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error: unknown) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Category } from "@/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const categories = await Category.find({
    $or: [{ userId: null }, { userId: session.user.id }],
  }).sort({ isSystemDefault: -1, name: 1 }).lean();

  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, type, icon, color } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    await connectDB();
    const newCategory = await Category.create({
      userId: session.user.id,
      name: name.trim(),
      type,
      icon: icon || "Tag",
      color: color || "#6366f1",
      isSystemDefault: false,
    });

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error: unknown) {
    console.error("Category creation error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

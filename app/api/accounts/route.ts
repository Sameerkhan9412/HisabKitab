import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { Account } from "@/models";
import { AccountSchema } from "@/lib/validations";
import { toMinorUnits } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const accounts = await Account.find({
    userId: session.user.id,
    isArchived: false,
  }).sort({ createdAt: 1 }).lean();

  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = AccountSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, type, currency, openingBalance, creditLimit, statementDate, dueDate, color } =
      validatedData.data;

    const minorOpening = toMinorUnits(openingBalance);
    const minorLimit = creditLimit !== undefined ? toMinorUnits(creditLimit) : undefined;

    await connectDB();
    const newAccount = await Account.create({
      userId: session.user.id,
      name,
      type,
      currency: currency || session.user.defaultCurrency || "INR",
      openingBalance: minorOpening,
      currentBalance: minorOpening,
      creditLimit: minorLimit,
      statementDate,
      dueDate,
      color: color || "#10b981",
    });

    return NextResponse.json({ account: newAccount }, { status: 201 });
  } catch (error: unknown) {
    console.error("Account creation error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

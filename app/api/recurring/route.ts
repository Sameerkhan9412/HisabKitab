import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { RecurringTransaction } from "@/models";
import { RecurringSchema } from "@/lib/validations";
import { toMinorUnits } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const recurring = await RecurringTransaction.find({ userId: session.user.id })
    .sort({ nextOccurrence: 1 })
    .populate("categoryId", "name icon color")
    .populate("accountId", "name type color")
    .lean();

  return NextResponse.json({ recurring });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = RecurringSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { type, amount, accountId, categoryId, description, frequency, startDate, endDate } =
      validated.data;

    await connectDB();

    const minorAmount = toMinorUnits(amount);
    const start = new Date(startDate);

    const recurring = await RecurringTransaction.create({
      userId: session.user.id,
      type,
      amount: minorAmount,
      accountId,
      categoryId,
      description: description.trim(),
      frequency,
      startDate: start,
      endDate: endDate ? new Date(endDate) : undefined,
      nextOccurrence: start,
      status: "ACTIVE",
    });

    return NextResponse.json({ recurring }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create recurring transaction error:", error);
    return NextResponse.json({ error: "Failed to create recurring rule" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/mongoose";
import { SavingsGoal, Notification } from "@/models";
import { SavingsGoalSchema } from "@/lib/validations";
import { toMinorUnits } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const goals = await SavingsGoal.find({ userId: session.user.id })
    .sort({ isCompleted: 1, targetDate: 1 })
    .lean();

  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = SavingsGoalSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, targetAmount, currentAmount, targetDate, color, icon } = validated.data;

    await connectDB();

    const minorTarget = toMinorUnits(targetAmount);
    const minorCurrent = toMinorUnits(currentAmount || 0);

    const goal = await SavingsGoal.create({
      userId: session.user.id,
      name: name.trim(),
      targetAmount: minorTarget,
      currentAmount: minorCurrent,
      targetDate: new Date(targetDate),
      color: color || "#10b981",
      icon: icon || "Target",
      isCompleted: minorCurrent >= minorTarget,
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create savings goal error:", error);
    return NextResponse.json({ error: "Failed to create savings goal" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { goalId, contributionAmount } = await req.json();
    if (!goalId || contributionAmount === undefined) {
      return NextResponse.json({ error: "Goal ID and contribution amount are required" }, { status: 400 });
    }

    await connectDB();
    const goal = await SavingsGoal.findOne({ _id: goalId, userId: session.user.id });
    if (!goal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    const minorContribution = toMinorUnits(contributionAmount);
    goal.currentAmount += minorContribution;

    if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
      // Trigger milestone notification
      await Notification.create({
        userId: session.user.id,
        type: "GOAL_MILESTONE",
        title: "Savings Goal Achieved! 🎉",
        message: `Congratulations! You reached your savings target for "${goal.name}".`,
        link: "/goals",
      });
    }

    await goal.save();

    return NextResponse.json({ goal });
  } catch (error: unknown) {
    console.error("Update savings goal error:", error);
    return NextResponse.json({ error: "Failed to update savings goal" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import { User, Account, Category } from "@/models";
import { RegisterSchema } from "@/lib/validations";

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", type: "EXPENSE", icon: "Utensils", color: "#f97316" },
  { name: "Groceries", type: "EXPENSE", icon: "ShoppingCart", color: "#10b981" },
  { name: "Transport", type: "EXPENSE", icon: "Car", color: "#06b6d4" },
  { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag", color: "#ec4899" },
  { name: "Entertainment", type: "EXPENSE", icon: "Film", color: "#8b5cf6" },
  { name: "Housing & Rent", type: "EXPENSE", icon: "Home", color: "#3b82f6" },
  { name: "Utilities & Bills", type: "EXPENSE", icon: "Zap", color: "#eab308" },
  { name: "Health & Medical", type: "EXPENSE", icon: "HeartPulse", color: "#ef4444" },
  { name: "Education", type: "EXPENSE", icon: "GraduationCap", color: "#6366f1" },
  { name: "Travel & Trips", type: "EXPENSE", icon: "Plane", color: "#14b8a6" },
  { name: "Subscriptions", type: "EXPENSE", icon: "Repeat", color: "#a855f7" },
  { name: "Miscellaneous", type: "EXPENSE", icon: "MoreHorizontal", color: "#64748b" },
  { name: "Salary", type: "INCOME", icon: "Briefcase", color: "#10b981" },
  { name: "Freelance & Consulting", type: "INCOME", icon: "Laptop", color: "#06b6d4" },
  { name: "Investments & Dividends", type: "INCOME", icon: "TrendingUp", color: "#3b82f6" },
  { name: "Gift & Bonus", type: "INCOME", icon: "Gift", color: "#ec4899" },
  { name: "Refunds", type: "INCOME", icon: "RotateCcw", color: "#8b5cf6" },
  { name: "Other Income", type: "INCOME", icon: "PlusCircle", color: "#64748b" },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = RegisterSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, defaultCurrency, timezone } = validatedData.data;

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      defaultCurrency: defaultCurrency || "INR",
      timezone: timezone || "Asia/Kolkata",
      dateFormat: "dd/MM/yyyy",
      numberFormat: defaultCurrency === "INR" ? "en-IN" : "en-US",
      onboardingCompleted: false,
    });

    // Seed initial default accounts
    await Account.create([
      {
        userId: newUser._id,
        name: "Cash in Hand",
        type: "CASH",
        currency: defaultCurrency || "INR",
        openingBalance: 0,
        currentBalance: 0,
        color: "#10b981",
      },
      {
        userId: newUser._id,
        name: "Primary Bank Account",
        type: "BANK",
        currency: defaultCurrency || "INR",
        openingBalance: 0,
        currentBalance: 0,
        color: "#3b82f6",
      },
    ]);

    // Ensure system default categories exist or create user-specific defaults
    const categoryCount = await Category.countDocuments({ isSystemDefault: true });
    if (categoryCount === 0) {
      await Category.create(
        DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          isSystemDefault: true,
          userId: null,
        }))
      );
    }

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          defaultCurrency: newUser.defaultCurrency,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}

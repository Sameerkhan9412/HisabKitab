import { z } from "zod";

export const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    defaultCurrency: z.string().default("INR"),
    timezone: z.string().default("Asia/Kolkata"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const TransactionSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().default("INR"),
  accountId: z.string().min(1, "Account is required"),
  toAccountId: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  merchant: z.string().optional(),
  description: z.string().min(2, "Description must be at least 2 characters"),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  receiptUrl: z.string().optional(),
  isRecurring: z.boolean().optional().default(false),
});

export const AccountSchema = z.object({
  name: z.string().min(2, "Account name is required"),
  type: z.enum(["CASH", "BANK", "CREDIT_CARD", "DEBIT_CARD", "WALLET", "INVESTMENT", "OTHER"]),
  currency: z.string().default("INR"),
  openingBalance: z.number().default(0),
  creditLimit: z.number().optional(),
  statementDate: z.number().min(1).max(31).optional(),
  dueDate: z.number().min(1).max(31).optional(),
  color: z.string().optional().default("#10b981"),
});

export const BudgetSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be in YYYY-MM format"),
  overallLimit: z.number().min(0, "Overall limit cannot be negative"),
  categoryLimits: z
    .array(
      z.object({
        categoryId: z.string(),
        limit: z.number().min(0),
        rollover: z.boolean().optional().default(false),
      })
    )
    .optional()
    .default([]),
  alertThresholds: z.array(z.number()).optional().default([50, 75, 90, 100]),
});

export const RoomSchema = z.object({
  name: z.string().min(2, "Room name must be at least 2 characters").max(80),
  description: z.string().max(300).optional(),
  icon: z.string().default("Users"),
  currency: z.string().default("INR"),
});

export const SharedExpenseSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  title: z.string().min(2, "Title is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().default("INR"),
  date: z.string().min(1, "Date is required"),
  categoryId: z.string().optional(),
  splitType: z.enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"]),
  payers: z
    .array(
      z.object({
        userId: z.string(),
        amount: z.number().min(0),
      })
    )
    .min(1, "At least one payer is required"),
  splits: z
    .array(
      z.object({
        userId: z.string(),
        amount: z.number().min(0).optional(),
        percentage: z.number().optional(),
        shares: z.number().optional(),
      })
    )
    .min(1, "At least one participant is required"),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const SettlementSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  fromUserId: z.string().min(1, "Debtor is required"),
  toUserId: z.string().min(1, "Creditor is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().default("INR"),
  method: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"]).default("UPI"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export const SavingsGoalSchema = z.object({
  name: z.string().min(2, "Goal name is required"),
  targetAmount: z.number().positive("Target amount must be greater than zero"),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().min(1, "Target date is required"),
  color: z.string().optional().default("#10b981"),
  icon: z.string().optional().default("Target"),
});

export const RecurringSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
  amount: z.number().positive("Amount must be greater than zero"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().min(2, "Description is required"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

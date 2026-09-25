import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number; // in integer minor units (paise/cents)
  currency: string;
  accountId: mongoose.Types.ObjectId;
  toAccountId?: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  subCategory?: string;
  date: Date;
  merchant?: string;
  description: string;
  notes?: string;
  tags: string[];
  receiptUrl?: string;
  isRecurring: boolean;
  recurringId?: mongoose.Types.ObjectId;
  sharedExpenseId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["EXPENSE", "INCOME", "TRANSFER"], required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true, index: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subCategory: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
    merchant: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    receiptUrl: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringId: { type: Schema.Types.ObjectId, ref: "RecurringTransaction" },
    sharedExpenseId: { type: Schema.Types.ObjectId, ref: "SharedExpense" },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, isDeleted: 1, date: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1, isDeleted: 1 });
TransactionSchema.index({ userId: 1, accountId: 1, isDeleted: 1 });

export const Transaction: Model<ITransactionDocument> =
  mongoose.models.Transaction || mongoose.model<ITransactionDocument>("Transaction", TransactionSchema);

export default Transaction;

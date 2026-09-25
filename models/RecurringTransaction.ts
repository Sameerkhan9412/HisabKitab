import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecurringTransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number; // in integer minor units
  accountId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  description: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  startDate: Date;
  endDate?: Date;
  nextOccurrence: Date;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTransactionSchema = new Schema<IRecurringTransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["EXPENSE", "INCOME", "TRANSFER"], required: true },
    amount: { type: Number, required: true, min: 1 },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, required: true, trim: true },
    frequency: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"],
      default: "MONTHLY",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    nextOccurrence: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "COMPLETED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

export const RecurringTransaction: Model<IRecurringTransactionDocument> =
  mongoose.models.RecurringTransaction ||
  mongoose.model<IRecurringTransactionDocument>("RecurringTransaction", RecurringTransactionSchema);

export default RecurringTransaction;

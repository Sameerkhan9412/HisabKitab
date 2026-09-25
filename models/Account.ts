import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccountDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: string;
  currency: string;
  openingBalance: number; // in integer minor units
  currentBalance: number; // in integer minor units
  creditLimit?: number;
  statementDate?: number;
  dueDate?: number;
  color?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccountDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["CASH", "BANK", "CREDIT_CARD", "DEBIT_CARD", "WALLET", "INVESTMENT", "OTHER"],
      default: "CASH",
    },
    currency: { type: String, default: "INR" },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    creditLimit: { type: Number },
    statementDate: { type: Number, min: 1, max: 31 },
    dueDate: { type: Number, min: 1, max: 31 },
    color: { type: String, default: "#10b981" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AccountSchema.index({ userId: 1, isArchived: 1 });

export const Account: Model<IAccountDocument> =
  mongoose.models.Account || mongoose.model<IAccountDocument>("Account", AccountSchema);

export default Account;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayerSubdoc {
  userId: mongoose.Types.ObjectId;
  amount: number; // in integer minor units
}

export interface ISplitSubdoc {
  userId: mongoose.Types.ObjectId;
  amount: number; // in integer minor units
  percentage?: number;
  shares?: number;
}

export interface ISharedExpenseDocument extends Document {
  roomId: mongoose.Types.ObjectId;
  title: string;
  amount: number; // in integer minor units
  currency: string;
  date: Date;
  categoryId?: mongoose.Types.ObjectId;
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";
  payers: IPayerSubdoc[];
  splits: ISplitSubdoc[];
  notes?: string;
  receiptUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  isSettled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PayerSchema = new Schema<IPayerSubdoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const SplitSchema = new Schema<ISplitSubdoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    percentage: { type: Number },
    shares: { type: Number },
  },
  { _id: false }
);

const SharedExpenseSchema = new Schema<ISharedExpenseDocument>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },
    date: { type: Date, required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    splitType: {
      type: String,
      enum: ["EQUAL", "EXACT", "PERCENTAGE", "SHARES"],
      default: "EQUAL",
    },
    payers: { type: [PayerSchema], required: true },
    splits: { type: [SplitSchema], required: true },
    notes: { type: String, trim: true },
    receiptUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isSettled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SharedExpenseSchema.index({ roomId: 1, date: -1 });

export const SharedExpense: Model<ISharedExpenseDocument> =
  mongoose.models.SharedExpense ||
  mongoose.model<ISharedExpenseDocument>("SharedExpense", SharedExpenseSchema);

export default SharedExpense;

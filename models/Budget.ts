import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategoryLimit {
  categoryId: mongoose.Types.ObjectId;
  limit: number; // in integer minor units
  rollover?: boolean;
}

export interface IBudgetDocument extends Document {
  userId: mongoose.Types.ObjectId;
  period: string; // YYYY-MM
  overallLimit: number; // in integer minor units
  categoryLimits: ICategoryLimit[];
  alertThresholds: number[];
  createdAt: Date;
  updatedAt: Date;
}

const CategoryLimitSchema = new Schema<ICategoryLimit>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    limit: { type: Number, required: true, min: 0 },
    rollover: { type: Boolean, default: false },
  },
  { _id: false }
);

const BudgetSchema = new Schema<IBudgetDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    period: { type: String, required: true, index: true }, // e.g. '2026-09'
    overallLimit: { type: Number, required: true, min: 0 },
    categoryLimits: [CategoryLimitSchema],
    alertThresholds: { type: [Number], default: [50, 75, 90, 100] },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, period: 1 }, { unique: true });

export const Budget: Model<IBudgetDocument> =
  mongoose.models.Budget || mongoose.model<IBudgetDocument>("Budget", BudgetSchema);

export default Budget;

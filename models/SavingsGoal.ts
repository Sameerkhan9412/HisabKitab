import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavingsGoalDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number; // in integer minor units
  currentAmount: number; // in integer minor units
  targetDate: Date;
  color: string;
  icon: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoalDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, required: true },
    color: { type: String, default: "#10b981" },
    icon: { type: String, default: "Target" },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SavingsGoal: Model<ISavingsGoalDocument> =
  mongoose.models.SavingsGoal ||
  mongoose.model<ISavingsGoalDocument>("SavingsGoal", SavingsGoalSchema);

export default SavingsGoal;

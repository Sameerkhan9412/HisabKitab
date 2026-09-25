import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatarUrl?: string;
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  firstDayOfMonth: number;
  theme: "light" | "dark" | "system";
  onboardingCompleted: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    avatarUrl: { type: String, default: "" },
    defaultCurrency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    dateFormat: { type: String, default: "dd/MM/yyyy" },
    numberFormat: { type: String, default: "en-IN" },
    firstDayOfMonth: { type: Number, default: 1, min: 1, max: 28 },
    theme: { type: String, enum: ["light", "dark", "system"], default: "dark" },
    onboardingCompleted: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;

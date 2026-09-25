import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategoryDocument extends Document {
  userId?: mongoose.Types.ObjectId | null;
  name: string;
  type: "EXPENSE" | "INCOME";
  icon: string;
  color: string;
  isSystemDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["EXPENSE", "INCOME"], required: true },
    icon: { type: String, default: "Tag" },
    color: { type: String, default: "#6366f1" },
    isSystemDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, type: 1 });

export const Category: Model<ICategoryDocument> =
  mongoose.models.Category || mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default Category;

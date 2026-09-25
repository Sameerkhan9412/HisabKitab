import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoomDocument extends Document {
  name: string;
  description?: string;
  icon: string;
  currency: string;
  createdBy: mongoose.Types.ObjectId;
  inviteCode: string;
  inviteCodeExpiresAt?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoomDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, default: "Users" },
    currency: { type: String, default: "INR" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    inviteCode: { type: String, required: true, unique: true, index: true },
    inviteCodeExpiresAt: { type: Date },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Room: Model<IRoomDocument> =
  mongoose.models.Room || mongoose.model<IRoomDocument>("Room", RoomSchema);

export default Room;

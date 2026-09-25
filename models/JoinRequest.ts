import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJoinRequestDocument extends Document {
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  invitedBy?: mongoose.Types.ObjectId;
  type: "JOIN_REQUEST" | "INVITATION";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JoinRequestSchema = new Schema<IJoinRequestDocument>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["JOIN_REQUEST", "INVITATION"], default: "JOIN_REQUEST" },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

JoinRequestSchema.index({ roomId: 1, userId: 1, status: 1 });

export const JoinRequest: Model<IJoinRequestDocument> =
  mongoose.models.JoinRequest || mongoose.model<IJoinRequestDocument>("JoinRequest", JoinRequestSchema);

export default JoinRequest;

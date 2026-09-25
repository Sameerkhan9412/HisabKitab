import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettlementDocument extends Document {
  roomId: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  amount: number; // in integer minor units
  currency: string;
  method: "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "OTHER";
  date: Date;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlementDocument>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },
    method: {
      type: String,
      enum: ["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"],
      default: "UPI",
    },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

SettlementSchema.index({ roomId: 1, date: -1 });

export const Settlement: Model<ISettlementDocument> =
  mongoose.models.Settlement ||
  mongoose.model<ISettlementDocument>("Settlement", SettlementSchema);

export default Settlement;

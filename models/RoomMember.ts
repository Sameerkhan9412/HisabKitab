import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoomMemberDocument extends Document {
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: Date;
}

const RoomMemberSchema = new Schema<IRoomMemberDocument>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["OWNER", "ADMIN", "MEMBER"], default: "MEMBER" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RoomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

export const RoomMember: Model<IRoomMemberDocument> =
  mongoose.models.RoomMember || mongoose.model<IRoomMemberDocument>("RoomMember", RoomMemberSchema);

export default RoomMember;

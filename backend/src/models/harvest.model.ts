import mongoose, { Schema, Document, Model } from "mongoose"

export type HarvestStatus = "pending" | "approved" | "rejected"

export interface IHarvest extends Document {
  id: string
  farmId: mongoose.Types.ObjectId
  farmerId: mongoose.Types.ObjectId
  imageUrl: string
  status: HarvestStatus
  rejectionReason?: string
  submittedAt: Date
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const harvestSchema = new Schema<IHarvest>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    rejectionReason: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now, index: true },
    approvedAt: { type: Date }
  },
  { timestamps: true }
)

// Indexes for better query performance
harvestSchema.index({ farmId: 1, status: 1 })
harvestSchema.index({ farmerId: 1, status: 1 })
harvestSchema.index({ status: 1, submittedAt: -1 })
harvestSchema.index({ submittedAt: -1 })

export const Harvest: Model<IHarvest> = mongoose.model<IHarvest>("Harvest", harvestSchema)
export default Harvest
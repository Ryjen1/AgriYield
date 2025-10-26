import mongoose, { Schema, type Document } from "mongoose"

export type FarmStatus = "pending" | "active" | "funded" | "settled" | "closed"
export type FarmType = "crop" | "livestock" | "mixed" | "poultry" | "fishery"
export type IrrigationType = "rainfed" | "irrigated" | "supplemental"

export interface IFarm extends Document {
  blockchainFarmId: number | string
  farmerAddress?: string
  farmer: string
  fundingGoal: number
  sharePrice: string
  totalInvested: string
  proceeds: string
  totalProceeds: number
  deadline: number
  verified: boolean
  minROI: number
  maxROI: number
  metaCID: string
  syncedFromChain: boolean
  farmerId: string

  name: string
  description: string
  location: {
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    state: string
    country: string
  }
  farmType: FarmType
  totalArea: number
  cultivatedArea: number
  irrigationType: IrrigationType
  crops: string[]
  images: string[]
  documents: string[]
  expectedYield: number
  plantingDate?: Date
  harvestDate?: Date

  status: FarmStatus
  investorCount: number
  amountRaised: number
  fundsDisbursed: boolean
  closed: boolean
  lastSyncedAt?: Date

  createdAt: Date
  updatedAt: Date
}

const farmSchema = new Schema<IFarm>(
  {
    blockchainFarmId: { type: Number, unique: true, sparse: true, index: true },
    farmerAddress: { type: String, unique: true, sparse: true, lowercase: true, index: true },
    farmer: { type: String, required: true, lowercase: true, index: true },
    fundingGoal: { type: Number },
    sharePrice: { type: String },
    totalInvested: { type: String, default: "0" },
    proceeds: { type: String, default: "0" },
    totalProceeds: { type: Number, default: 0, min: 0 },
    deadline: { type: Number },
    verified: { type: Boolean, default: false },
    minROI: { type: Number },
    maxROI: { type: Number },
    metaCID: { type: String },
    farmerId: { type: String },
    syncedFromChain: { type: Boolean, default: false },

    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    location: {
      address: { type: String, required: true, trim: true },
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
      },
      state: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true, default: "Nigeria" },
    },
    farmType: { type: String, enum: ["crop", "livestock", "mixed", "poultry", "fishery"], required: true, index: true },
    totalArea: { type: Number, required: true, min: 0.1 },
    cultivatedArea: { type: Number, required: true, min: 0.1 },
    irrigationType: { type: String, enum: ["rainfed", "irrigated", "supplemental"], required: true },
    crops: [{ type: String, trim: true }],
    images: [{ type: String, trim: true }],
    documents: [{ type: String, trim: true }],
    expectedYield: { type: Number, required: true, min: 0 },
    plantingDate: { type: Date },
    harvestDate: { type: Date },

    status: { type: String, enum: ["pending", "active", "funded", "settled", "closed"], default: "pending", index: true },
    investorCount: { type: Number, default: 0, min: 0 },
    amountRaised: { type: Number, default: 0 },
    fundsDisbursed: { type: Boolean, default: false },
    closed: { type: Boolean, default: false },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true },
)

farmSchema.index({ farmer: 1, status: 1 })
farmSchema.index({ status: 1, verified: 1 })
farmSchema.index({ deadline: 1 })
farmSchema.index({ "location.state": 1, status: 1 })
farmSchema.index({ farmType: 1, status: 1 })
farmSchema.index({ createdAt: -1 })

export const Farm = mongoose.model<IFarm>("Farm", farmSchema)

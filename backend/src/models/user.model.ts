import mongoose, { Schema, Document, Model } from "mongoose"
import bcrypt from "bcrypt"

export type UserRole = "investor" | "farmer" | "admin"
export type KYCStatus = "pending" | "approved" | "rejected"
export type DocumentType = "national_id" | "passport" | "drivers_license" | "utility_bill"

export interface KYCDocument {
  documentType: DocumentType
  documentUrl: string
  uploadedAt: Date
}

export interface IUser extends Document {
  email: string
  password?: string
  magicToken?: string
  name: string
  role: UserRole
  profileImageUrl?: string
  walletAddress?: string
  farmName?: string
  farmDescription?: string
  location?: string
  nin?: string
  verified: boolean
  kycStatus: KYCStatus
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/ },
    password: { type: String, select: false },
    magicToken: { type: String, select: false },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    role: { type: String, enum: ["investor", "farmer", "admin"], required: true },
    profileImageUrl: { type: String, trim: true },
    walletAddress: { type: String, lowercase: true, match: /^0x[a-fA-F0-9]{40}$/, sparse: true },
    farmName: { type: String, trim: true },
    farmDescription: { type: String, trim: true, maxlength: 1000 },
    location: { type: String, trim: true },
    nin: { type: String, trim: true, sparse: true },
    verified: { type: Boolean, default: false },
    kycStatus: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
)

userSchema.index({ email: 1 }, { unique: true, sparse: true })
userSchema.index({ role: 1 })
userSchema.index({ walletAddress: 1 }, { sparse: true })
userSchema.index({ verified: 1, kycStatus: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ role: 1, verified: 1 })

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  if (this.isModified() && this.isActive) {
    this.lastLoginAt = new Date()
  }
  next()
})

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(password, this.password)
}

userSchema.virtual("farmerProfileComplete").get(function () {
  if (this.role !== "farmer") return null
  return !!(this.farmName && this.farmDescription && this.location)
})

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema)
export default User

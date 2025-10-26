import jwt from "jsonwebtoken"
import { User, type IUser } from "../models/user.model"
import { envConfig } from "../config/env"
import { verifyMagicToken } from "../config/magic"
import { isAddress } from "ethers"

export interface RegisterUserPayload {
  email: string
  name: string
  role: "investor" | "farmer"
  farmName?: string
  farmDescription?: string
  location?: string
  nin?: string
  magicToken?: string
  magicUserId?: string
  walletAddress?: string
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export class AuthService {
  static async registerUser(payload: RegisterUserPayload): Promise<IUser> {
    try {
      const existingUser = await User.findOne({ email: payload.email })
      if (existingUser) throw new Error("User with this email already exists")

      if (payload.role === "farmer" && (!payload.farmName || !payload.location))
        throw new Error("Farm name and location are required for farmer registration")

      const user = await User.create({
        email: payload.email,
        name: payload.name,
        role: payload.role,
        farmName: payload.farmName,
        farmDescription: payload.farmDescription,
        location: payload.location,
        nin: payload.nin,
        magicToken: payload.magicToken,
        magicUserId: payload.magicUserId,
        walletAddress: payload.walletAddress,
        isActive: true,
      })

      const userObject = user.toObject()
      delete userObject.magicToken
      delete userObject.password
      return userObject as IUser
    } catch (error: any) {
      throw new Error(`User registration failed: ${error.message}`)
    }
  }

  static async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email: email.toLowerCase() }).select("-password -magicToken")
    } catch (error: any) {
      throw new Error(`Failed to fetch user by email: ${error.message}`)
    }
  }

  static async getUserById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).select("-password -magicToken")
    } catch (error: any) {
      throw new Error(`Failed to fetch user by ID: ${error.message}`)
    }
  }

  static async updateUserWallet(userId: string, walletAddress: string): Promise<IUser | null> {
    try {
      if (!this.isValidWalletAddress(walletAddress))
        throw new Error("Invalid wallet address format")

      const existingWallet = await User.findOne({
        walletAddress: walletAddress.toLowerCase(),
        _id: { $ne: userId },
      })
      if (existingWallet)
        throw new Error("This wallet is already connected to another account")

      const user = await User.findByIdAndUpdate(
        userId,
        { walletAddress: walletAddress.toLowerCase() },
        { new: true, runValidators: true }
      ).select("-password -magicToken")

      if (!user) throw new Error("User not found")
      return user
    } catch (error: any) {
      throw new Error(`Failed to update wallet: ${error.message}`)
    }
  }

  static generateToken(userId: string, email: string, role: string): string {
    try {
      const payload: JWTPayload = { userId, email, role }
      const secret = envConfig.JWT_SECRET
      if (!secret) throw new Error("JWT_SECRET not defined")

      return jwt.sign(payload, secret, {
        expiresIn: (envConfig.JWT_EXPIRY || "7d") as jwt.SignOptions["expiresIn"],
      })
    } catch (error: any) {
      throw new Error(`Token generation failed: ${error.message}`)
    }
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, envConfig.JWT_SECRET) as JWTPayload
    } catch (error: any) {
      if (error.name === "TokenExpiredError") throw new Error("Token has expired")
      if (error.name === "JsonWebTokenError") throw new Error("Invalid token")
      throw new Error(`Token verification failed: ${error.message}`)
    }
  }

  static async authenticateWithMagic(didToken: string): Promise<any> {
    try {
      return await verifyMagicToken(didToken)
    } catch (error: any) {
      throw new Error(`Magic authentication failed: ${error.message}`)
    }
  }

  static async loginWithMagic(didToken: string): Promise<{
    user: IUser
    token: string
    isNewUser: boolean
  }> {
    try {
      const magicMetadata = await this.authenticateWithMagic(didToken)
      if (!magicMetadata.email) throw new Error("Email not found in Magic metadata")

      const user = await User.findOne({ email: magicMetadata.email.toLowerCase() })
      if (!user) throw new Error("User not found. Please complete registration first.")

      user.lastLoginAt = new Date()
      await user.save()

      const token = this.generateToken(String(user._id), user.email, user.role)
      const userObject = user.toObject()
      delete userObject.magicToken
      delete userObject.password

      return { user: userObject as IUser, token, isNewUser: false }
    } catch (error: any) {
      throw new Error(`Magic login failed: ${error.message}`)
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<IUser>): Promise<IUser | null> {
    try {
      const allowedUpdates = ["name", "profileImageUrl", "farmName", "farmDescription", "location"]
      const filteredUpdates: any = {}
      Object.keys(updates).forEach((key) => {
        if (allowedUpdates.includes(key)) filteredUpdates[key] = (updates as any)[key]
      })

      return await User.findByIdAndUpdate(userId, filteredUpdates, {
        new: true,
        runValidators: true,
      }).select("-password -magicToken")
    } catch (error: any) {
      throw new Error(`Profile update failed: ${error.message}`)
    }
  }

  static async deactivateUser(userId: string): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      ).select("-password -magicToken")
    } catch (error: any) {
      throw new Error(`Account deactivation failed: ${error.message}`)
    }
  }

  private static isValidWalletAddress(address: string): boolean {
    return isAddress(address)
  }

  static async userExists(email: string): Promise<boolean> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() })
      return !!user
    } catch {
      return false
    }
  }

  static async getUserStats(userId: string): Promise<{
    totalInvestments?: number
    activeFarms?: number
    accountAge: number
  }> {
    try {
      const user = await User.findById(userId)
      if (!user) throw new Error("User not found")

      const accountAge = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      return { accountAge }
    } catch (error: any) {
      throw new Error(`Failed to get user stats: ${error.message}`)
    }
  }
}

export default AuthService

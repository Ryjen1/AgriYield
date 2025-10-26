import type { Request, Response, NextFunction } from "express"
import { AuthService } from "../services/authService"
import { validateFarmerFields } from "../validators/auth.validator"
import type { AuthRequest } from "../middleware/auth.middleware"
import { AppError } from "../utils/appError"

export class AuthController {
  /**
   * POST /auth/signup
   * Register a new user (investor or farmer)
   */
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, role, farmName, farmDescription, location, nin, magicToken } = req.body

      if (role === "farmer") {
        if (!farmName || !location) {
          throw new AppError("Farm name and location required for farmers", 400)
        }
        validateFarmerFields(req.body)
      }

      const existingUser = await AuthService.userExists(email)
      if (existingUser) {
        throw new AppError("User with this email already exists", 409)
      }
      const magicMetadata = await AuthService.authenticateWithMagic(magicToken)
      if (magicMetadata.email.toLowerCase() !== email.toLowerCase()) {
        throw new AppError("Email mismatch with Magic authentication", 400)
      }


      const user = await AuthService.registerUser({
        email,
        name,
        role,
        farmName: role === "farmer" ? farmName : undefined,
        farmDescription: role === "farmer" ? farmDescription : undefined,
        location: role === "farmer" ? location : undefined,
        nin,
        magicToken,
        magicUserId: magicMetadata.issuer,
        walletAddress: magicMetadata.publicAddress
      })

      const token = AuthService.generateToken(String(user._id), user.email, user.role)

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            farmName: user.farmName,
            location: user.location,
            verified: user.verified,
            kycStatus: user.kycStatus,
          },
          token,
        },
      })
    } catch (error) {
      next(error)
    }
  }


  /**
   * POST /auth/signin
   * Sign in existing user with Magic token
   */
  static async signin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { magicToken } = req.body

      const { user, token, isNewUser } = await AuthService.loginWithMagic(magicToken)

      res.status(200).json({
        success: true,
        message: "Sign in successful",
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            farmName: user.farmName,
            location: user.location,
            walletAddress: user.walletAddress,
            verified: user.verified,
            kycStatus: user.kycStatus,
            profileImageUrl: user.profileImageUrl,
          },
          token,
          isNewUser,
        },
      })
    } catch (error: any) {
      if (error.message.includes("User not found")) {
        return next(new AppError("User not found. Please sign up first.", 404))
      }
      next(new AppError(error.message || "Authentication failed", 401))
    }
  }

  /**
   * POST /auth/check-user
   * Check if a user exists by email (no verification link sent)
   * Added new endpoint to check user existence before sending magic links
   */
  static async checkUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body

      if (!email) {
        throw new AppError("Email is required", 400)
      }

      const userExists = await AuthService.userExists(email)

      res.status(200).json({
        success: true,
        data: {
          exists: userExists,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /auth/connect-wallet
   * Connect wallet address to user account (protected)
   */
  static async connectWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { walletAddress } = req.body
      const userId = req.user?.userId

      if (!userId) {
        throw new AppError("Authentication required", 401)
      }

      const updatedUser = await AuthService.updateUserWallet(userId, walletAddress)

      if (!updatedUser) {
        throw new AppError("User not found", 404)
      }

      res.status(200).json({
        success: true,
        message: "Wallet connected successfully",
        data: {
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            walletAddress: updatedUser.walletAddress,
          },
        },
      })
    } catch (error: any) {
      if (error.message.includes("already connected")) {
        return next(new AppError(error.message, 409))
      }
      next(new AppError(error.message || "Failed to connect wallet", 500))
    }
  }

  /**
   * GET /auth/profile
   * Get authenticated user profile (protected)
   */
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId

      if (!userId) {
        throw new AppError("Authentication required", 401)
      }

      const user = await AuthService.getUserById(userId)
      if (!user) {
        throw new AppError("User not found", 404)
      }

      const stats = await AuthService.getUserStats(userId)

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            walletAddress: user.walletAddress,
            farmName: user.farmName,
            farmDescription: user.farmDescription,
            location: user.location,
            verified: user.verified,
            kycStatus: user.kycStatus,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
          },
          stats,
        },
      })
    } catch (error) {
      next(error)
    }
  }
}

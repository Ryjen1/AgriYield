import type { Request, Response, NextFunction } from "express"
import { AuthService } from "../services/authService"
import { UserRole } from "../models/user.model"

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role: UserRole
  }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
      })
    }

    const token = authHeader.substring(7) 

    const decoded = AuthService.verifyToken(token)

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role as UserRole,
    }

    next()
  } catch (error: any) {
    if (error.message === "Token has expired") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please sign in again.",
      })
    }
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      })
    }

    next()
  }
}

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `You do not have permission as ${req.user.role}` })
      return
    }

    next()
  }
}
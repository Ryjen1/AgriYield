import type { Response, NextFunction } from "express"
import type { AuthRequest } from "./auth.middleware"
import { AppError } from "../utils/appError"

/**
 * Admin authorization middleware
 * Checks if user.role === 'admin'
 * Must be chained after authenticate middleware
 */
export const authorize = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401)
    }

    if (req.user.role !== "admin") {
      throw new AppError("Admin access required", 403)
    }

    next()
  } catch (error) {
    next(error)
  }
}

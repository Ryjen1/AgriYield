import { Request, Response } from "express"
import { HarvestService, CreateHarvestData } from "../services/harvest.service"
import { AuthRequest } from "../middleware/auth.middleware"
import { getUploadedFileUrl } from "../middleware/upload.middleware"

export class HarvestController {
  /**
   * Submit a new harvest (farmers only)
   * POST /api/harvest
   */
  static async submitHarvest(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user is authenticated and is a farmer
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        })
        return
      }

      if (req.user.role !== "farmer") {
        res.status(403).json({
          success: false,
          message: "Only farmers can submit harvests"
        })
        return
      }

      const { farmId } = req.body

      if (!farmId) {
        res.status(400).json({
          success: false,
          message: "Farm ID is required"
        })
        return
      }

      // Get the uploaded file URL
      const imageUrl = getUploadedFileUrl(req)

      if (!imageUrl) {
        res.status(400).json({
          success: false,
          message: "Harvest image is required"
        })
        return
      }

      const harvestData: CreateHarvestData = {
        farmId,
        farmerId: req.user.userId,
        imageUrl
      }

      const harvest = await HarvestService.createHarvest(harvestData)

      res.status(201).json({
        success: true,
        message: "Harvest submitted successfully",
        data: harvest
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to submit harvest"
      })
    }
  }

  /**
   * Get all pending harvests (admins only)
   * GET /api/harvest/pending
   */
  static async getPendingHarvests(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user is authenticated and is an admin
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        })
        return
      }

      if (req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only admins can view pending harvests"
        })
        return
      }

      const harvests = await HarvestService.getPendingHarvests()

      res.status(200).json({
        success: true,
        data: harvests
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get pending harvests"
      })
    }
  }

  /**
   * Approve a harvest (admins only)
   * POST /api/harvest/:id/approve
   */
  static async approveHarvest(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user is authenticated and is an admin
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        })
        return
      }

      if (req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only admins can approve harvests"
        })
        return
      }

      const { id } = req.params

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Harvest ID is required"
        })
        return
      }

      const harvest = await HarvestService.approveHarvest(id)

      if (!harvest) {
        res.status(404).json({
          success: false,
          message: "Harvest not found"
        })
        return
      }

      res.status(200).json({
        success: true,
        message: "Harvest approved successfully",
        data: harvest
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to approve harvest"
      })
    }
  }

  /**
   * Reject a harvest (admins only)
   * POST /api/harvest/:id/reject
   */
  static async rejectHarvest(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user is authenticated and is an admin
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        })
        return
      }

      if (req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only admins can reject harvests"
        })
        return
      }

      const { id } = req.params
      const { rejectionReason } = req.body

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Harvest ID is required"
        })
        return
      }

      const harvest = await HarvestService.rejectHarvest(id, rejectionReason)

      if (!harvest) {
        res.status(404).json({
          success: false,
          message: "Harvest not found"
        })
        return
      }

      res.status(200).json({
        success: true,
        message: "Harvest rejected successfully",
        data: harvest
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to reject harvest"
      })
    }
  }

  /**
   * Get harvests by farm ID
   * GET /api/harvest/:farmId
   */
  static async getHarvestsByFarmId(req: Request, res: Response): Promise<void> {
    try {
      const { farmId } = req.params
      const { status } = req.query

      if (!farmId) {
        res.status(400).json({
          success: false,
          message: "Farm ID is required"
        })
        return
      }

      const harvests = await HarvestService.getHarvestsByFarmId(
        farmId,
        status as "pending" | "approved" | "rejected" | undefined
      )

      res.status(200).json({
        success: true,
        data: harvests
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get harvests"
      })
    }
  }

  /**
   * Get harvest by ID
   * GET /api/harvest/:id
   */
  static async getHarvestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Harvest ID is required"
        })
        return
      }

      const harvest = await HarvestService.getHarvestById(id)

      if (!harvest) {
        res.status(404).json({
          success: false,
          message: "Harvest not found"
        })
        return
      }

      res.status(200).json({
        success: true,
        data: harvest
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get harvest"
      })
    }
  }

  /**
   * Delete a harvest
   * DELETE /api/harvest/:id
   */
  static async deleteHarvest(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user is authenticated and is an admin
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        })
        return
      }

      if (req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Only admins can delete harvests"
        })
        return
      }

      const { id } = req.params

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Harvest ID is required"
        })
        return
      }

      const deleted = await HarvestService.deleteHarvest(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Harvest not found"
        })
        return
      }

      res.status(200).json({
        success: true,
        message: "Harvest deleted successfully"
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete harvest"
      })
    }
  }
}
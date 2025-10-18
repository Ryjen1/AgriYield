import { FilterQuery, UpdateQuery } from "mongoose"
import { Harvest, IHarvest, HarvestStatus } from "../models/harvest.model"

export interface CreateHarvestData {
  farmId: string
  farmerId: string
  imageUrl: string
}

export interface UpdateHarvestStatusData {
  status: HarvestStatus
  rejectionReason?: string
}

export class HarvestService {
  /**
   * Create a new harvest submission
   */
  static async createHarvest(harvestData: CreateHarvestData): Promise<IHarvest> {
    try {
      const harvest = new Harvest({
        ...harvestData,
        status: "pending",
        submittedAt: new Date()
      })
      await harvest.save()
      return harvest
    } catch (error) {
      throw new Error(`Failed to create harvest: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get harvest by ID
   */
  static async getHarvestById(harvestId: string): Promise<IHarvest | null> {
    try {
      return await Harvest.findById(harvestId)
        .populate("farmId", "name location")
        .populate("farmerId", "name email")
        .exec()
    } catch (error) {
      throw new Error(`Failed to get harvest: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all pending harvests (admin function)
   */
  static async getPendingHarvests(): Promise<IHarvest[]> {
    try {
      return await Harvest.find({ status: "pending" })
        .populate("farmId", "name location")
        .populate("farmerId", "name email")
        .sort({ submittedAt: -1 })
        .exec()
    } catch (error) {
      throw new Error(`Failed to get pending harvests: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get harvests by farm ID with optional status filter
   */
  static async getHarvestsByFarmId(
    farmId: string,
    status?: HarvestStatus
  ): Promise<IHarvest[]> {
    try {
      const query: FilterQuery<IHarvest> = { farmId }

      if (status) {
        query.status = status
      }

      return await Harvest.find(query)
        .populate("farmId", "name location")
        .populate("farmerId", "name email")
        .sort({ submittedAt: -1 })
        .exec()
    } catch (error) {
      throw new Error(`Failed to get harvests by farm: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Approve harvest (admin function)
   */
  static async approveHarvest(harvestId: string): Promise<IHarvest | null> {
    try {
      return await Harvest.findByIdAndUpdate(
        harvestId,
        {
          status: "approved",
          approvedAt: new Date()
        },
        { new: true, runValidators: true }
      )
        .populate("farmId", "name location")
        .populate("farmerId", "name email")
        .exec()
    } catch (error) {
      throw new Error(`Failed to approve harvest: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Reject harvest (admin function)
   */
  static async rejectHarvest(
    harvestId: string,
    rejectionReason?: string
  ): Promise<IHarvest | null> {
    try {
      return await Harvest.findByIdAndUpdate(
        harvestId,
        {
          status: "rejected",
          rejectionReason: rejectionReason || "No reason provided"
        },
        { new: true, runValidators: true }
      )
        .populate("farmId", "name location")
        .populate("farmerId", "name email")
        .exec()
    } catch (error) {
      throw new Error(`Failed to reject harvest: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update harvest status
   */
  static async updateHarvestStatus(
    harvestId: string,
    updateData: UpdateHarvestStatusData
  ): Promise<IHarvest | null> {
    try {
      const updatePayload: UpdateQuery<IHarvest> = {
        status: updateData.status,
        updatedAt: new Date()
      }

      if (updateData.status === "approved") {
        updatePayload.approvedAt = new Date()
      } else if (updateData.status === "rejected" && updateData.rejectionReason) {
        updatePayload.rejectionReason = updateData.rejectionReason
      }

      return await Harvest.findByIdAndUpdate(
        harvestId,
        updatePayload,
        { new: true, runValidators: true }
      )
        .populate("farmId", "name location")
        .populate("farmerId", "name email")
        .exec()
    } catch (error) {
      throw new Error(`Failed to update harvest status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete harvest by ID
   */
  static async deleteHarvest(harvestId: string): Promise<boolean> {
    try {
      const result = await Harvest.findByIdAndDelete(harvestId).exec()
      return !!result
    } catch (error) {
      throw new Error(`Failed to delete harvest: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get harvest statistics for a farm
   */
  static async getHarvestStats(farmId: string): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
  }> {
    try {
      const stats = await Harvest.aggregate([
        { $match: { farmId: new (Harvest as any).schema.ObjectId(farmId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ])

      const result = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      }

      stats.forEach((stat: any) => {
        result.total += stat.count
        if (stat._id === "pending") result.pending = stat.count
        if (stat._id === "approved") result.approved = stat.count
        if (stat._id === "rejected") result.rejected = stat.count
      })

      return result
    } catch (error) {
      throw new Error(`Failed to get harvest stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
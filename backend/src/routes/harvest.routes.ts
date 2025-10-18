import { Router } from "express"
import { HarvestController } from "../controllers/harvest.controller"
import { authenticate, authorize } from "../middleware/auth.middleware"
import { uploadHarvestImage, handleUploadError, getUploadedFileUrl } from "../middleware/upload.middleware"

const router = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Harvest:
 *       type: object
 *       required:
 *         - farmId
 *         - farmerId
 *         - imageUrl
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Unique harvest identifier
 *         farmId:
 *           type: string
 *           description: ID of the farm this harvest belongs to
 *         farmerId:
 *           type: string
 *           description: ID of the farmer who submitted the harvest
 *         imageUrl:
 *           type: string
 *           description: URL of the harvest image
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Current status of the harvest
 *         rejectionReason:
 *           type: string
 *           description: Reason for rejection (if status is rejected)
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: When the harvest was submitted
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           description: When the harvest was approved (if applicable)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateHarvestRequest:
 *       type: object
 *       required:
 *         - farmId
 *         - imageUrl
 *       properties:
 *         farmId:
 *           type: string
 *           description: ID of the farm
 *         imageUrl:
 *           type: string
 *           description: URL of the harvest image
 *     ApproveHarvestRequest:
 *       type: object
 *       properties:
 *         rejectionReason:
 *           type: string
 *           description: Reason for rejection (only for reject endpoint)
 */

/**
 * @swagger
 * /api/harvest:
 *   post:
 *     summary: Submit a new harvest (Farmers only)
 *     tags: [Harvest]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHarvestRequest'
 *     responses:
 *       201:
 *         description: Harvest submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Harvest submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Harvest'
 *       400:
 *         description: Invalid input or missing required fields
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only farmers can submit harvests
 */
router.post(
  "/",
  authenticate,
  authorize("farmer"),
  uploadHarvestImage.single("harvestImage"),
  handleUploadError,
  HarvestController.submitHarvest
)

/**
 * @swagger
 * /api/harvest/pending:
 *   get:
 *     summary: Get all pending harvests (Admins only)
 *     tags: [Harvest]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending harvests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Harvest'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only admins can view pending harvests
 *       500:
 *         description: Internal server error
 */
router.get("/pending", authenticate, authorize("admin"), HarvestController.getPendingHarvests)

/**
 * @swagger
 * /api/harvest/{id}/approve:
 *   post:
 *     summary: Approve a harvest (Admins only)
 *     tags: [Harvest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Harvest ID
 *     responses:
 *       200:
 *         description: Harvest approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Harvest approved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Harvest'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only admins can approve harvests
 *       404:
 *         description: Harvest not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/approve", authenticate, authorize("admin"), HarvestController.approveHarvest)

/**
 * @swagger
 * /api/harvest/{id}/reject:
 *   post:
 *     summary: Reject a harvest (Admins only)
 *     tags: [Harvest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Harvest ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Harvest rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Harvest rejected successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Harvest'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only admins can reject harvests
 *       404:
 *         description: Harvest not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/reject", authenticate, authorize("admin"), HarvestController.rejectHarvest)

/**
 * @swagger
 * /api/harvest/{farmId}:
 *   get:
 *     summary: Get all harvests for a specific farm
 *     tags: [Harvest]
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: Farm ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by harvest status
 *     responses:
 *       200:
 *         description: List of harvests for the farm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Harvest'
 *       400:
 *         description: Farm ID is required
 *       500:
 *         description: Internal server error
 */
router.get("/:farmId", HarvestController.getHarvestsByFarmId)

/**
 * @swagger
 * /api/harvest/{id}:
 *   get:
 *     summary: Get harvest by ID
 *     tags: [Harvest]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Harvest ID
 *     responses:
 *       200:
 *         description: Harvest details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Harvest'
 *       400:
 *         description: Harvest ID is required
 *       404:
 *         description: Harvest not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", HarvestController.getHarvestById)

/**
 * @swagger
 * /api/harvest/{id}:
 *   delete:
 *     summary: Delete a harvest (Admins only)
 *     tags: [Harvest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Harvest ID
 *     responses:
 *       200:
 *         description: Harvest deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Harvest deleted successfully"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only admins can delete harvests
 *       404:
 *         description: Harvest not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticate, authorize("admin"), HarvestController.deleteHarvest)

export default router
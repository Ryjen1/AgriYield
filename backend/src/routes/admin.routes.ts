import { Router } from "express"
import { AdminController } from "../controllers/admin.controller"
import { authenticate } from "../middleware/auth.middleware"
import { authorize } from "../middleware/admin.middleware"
// import { FarmController } from "../controllers/farm.controller"

const router = Router()

router.use(authenticate, authorize)

/**
 * @swagger
 * /admin/farms:
 *   get:
 *     summary: Get all farms with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of farms
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get("/farms", AdminController.getFarms)

// /**
//  * @swagger
//  * /admin/farms/pending:
//  *   get:
//  *     summary: Get all pending farms awaiting verification
//  *     tags: [Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           default: 1
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 10
//  *     responses:
//  *       200:
//  *         description: List of pending farms
//  *       403:
//  *         description: Forbidden - Admin access required
//  */
// router.get("/farms/pending", FarmController.getPendingFarms)

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [farmer, investor, admin]
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: kycStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get("/users", AdminController.getUsers)

/**
 * @swagger
 * /admin/investments:
 *   get:
 *     summary: Get all investments with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of investments
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get("/investments", AdminController.getInvestments)

/**
 * @swagger
 * /admin/verify-farm/{farmId}:
 *   post:
 *     summary: Verify or unverify a farm
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verified:
 *                 type: boolean
 *               notes:
 *                 type: string
 *             required:
 *               - verified
 *     responses:
 *       200:
 *         description: Farm verification status updated
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Farm not found
 */
router.post("/verify-farm/:farmId", AdminController.verifyFarm)

/**
 * @swagger
 * /admin/approve-harvest/{harvestId}:
 *   post:
 *     summary: Approve or reject a harvest submission
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: harvestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *               notes:
 *                 type: string
 *             required:
 *               - approved
 *     responses:
 *       200:
 *         description: Harvest approval status updated
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Harvest not found
 */
router.post("/approve-harvest/:harvestId", AdminController.approveHarvest)

// /**
//  * @swagger
//  * /admin/farms/{farmId}/delist:
//  *   put:
//  *     summary: Delist a farm from the platform
//  *     tags: [Admin]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: farmId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               reason:
//  *                 type: string
//  *               notes:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Farm delisted successfully
//  *       400:
//  *         description: Invalid request
//  *       403:
//  *         description: Forbidden - Admin access required
//  *       404:
//  *         description: Farm not found
//  */
// router.put("/farms/:farmId/delist", FarmController.delistFarm)

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: Get platform analytics and statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Platform analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: number
 *                 totalFarmers:
 *                   type: number
 *                 totalInvestors:
 *                   type: number
 *                 totalFarms:
 *                   type: number
 *                 verifiedFarms:
 *                   type: number
 *                 totalInvestments:
 *                   type: number
 *                 totalInvested:
 *                   type: number
 *                 harvestApprovalRate:
 *                   type: number
 *                 recentActivity:
 *                   type: array
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get("/analytics", AdminController.getAnalytics)

export default router

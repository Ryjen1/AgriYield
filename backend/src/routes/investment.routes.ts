// import { Router } from "express"
// import { InvestmentController } from "../controllers/investment.controller"
// import { authenticate } from "../middleware/auth.middleware"
// import { validate } from "../middleware/validation.middleware"
// import { completeInvestmentSchema, confirmInvestmentSchema, createInvestmentSchema, processPayoutSchema } from "../validators/investment.validator"

// const router = Router()

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     Investment:
//  *       type: object
//  *       required:
//  *         - investorId
//  *         - farmId
//  *         - amount
//  *         - investmentType
//  *       properties:
//  *         investorId:
//  *           type: string
//  *           description: ID of the investor
//  *         farmId:
//  *           type: string
//  *           description: ID of the farm being invested in
//  *         amount:
//  *           type: number
//  *           description: Investment amount in Naira
//  *         investmentType:
//  *           type: string
//  *           enum: [equity, debt, tokenized]
//  *         expectedReturn:
//  *           type: number
//  *           description: Expected percentage return
//  *         maturityDate:
//  *           type: string
//  *           format: date
//  *         payoutSchedule:
//  *           type: string
//  *           enum: [monthly, quarterly, annually, end_of_season]
//  *         tokenAmount:
//  *           type: number
//  *           description: Number of tokens for tokenized investments
//  *         tokenSymbol:
//  *           type: string
//  *           description: Token symbol (e.g., FARM001)
//  *         contractAddress:
//  *           type: string
//  *           description: Blockchain contract address
//  *         transactionHash:
//  *           type: string
//  *           description: Blockchain transaction hash
//  *         terms:
//  *           type: string
//  *           description: Investment terms and conditions
//  *         documents:
//  *           type: array
//  *           items:
//  *             type: string
//  *         notes:
//  *           type: string
//  */

// /**
//  * @swagger
//  * /api/investments:
//  *   post:
//  *     summary: Create a new investment
//  *     tags: [Investments]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Investment'
//  *     responses:
//  *       201:
//  *         description: Investment created successfully
//  *       400:
//  *         description: Invalid input
//  */
// router.post("/", authenticate, validate(createInvestmentSchema), InvestmentController.createInvestment)

// /**
//  * @swagger
//  * /api/investments:
//  *   get:
//  *     summary: Get all investments with optional filtering
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: query
//  *         name: status
//  *         schema:
//  *           type: string
//  *         description: Filter by investment status
//  *       - in: query
//  *         name: investmentType
//  *         schema:
//  *           type: string
//  *         description: Filter by investment type
//  *       - in: query
//  *         name: investorId
//  *         schema:
//  *           type: string
//  *         description: Filter by investor ID
//  *       - in: query
//  *         name: farmId
//  *         schema:
//  *           type: string
//  *         description: Filter by farm ID
//  *       - in: query
//  *         name: minAmount
//  *         schema:
//  *           type: number
//  *         description: Minimum investment amount
//  *       - in: query
//  *         name: maxAmount
//  *         schema:
//  *           type: number
//  *         description: Maximum investment amount
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           minimum: 1
//  *         description: Page number
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           minimum: 1
//  *           maximum: 100
//  *         description: Number of items per page
//  *     responses:
//  *       200:
//  *         description: List of investments
//  */
// router.get("/", authenticate, InvestmentController.getInvestments)

// /**
//  * @swagger
//  * /api/investments/{id}:
//  *   get:
//  *     summary: Get investment by ID
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investment ID
//  *     responses:
//  *       200:
//  *         description: Investment details
//  *       404:
//  *         description: Investment not found
//  */
// router.get("/:id", authenticate, InvestmentController.getInvestmentById)

// /**
//  * @swagger
//  * /api/investments/{id}:
//  *   put:
//  *     summary: Update investment by ID
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investment ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Investment'
//  *     responses:
//  *       200:
//  *         description: Investment updated successfully
//  *       404:
//  *         description: Investment not found
//  */
// router.put("/:id", authenticate, validate(createInvestmentSchema.partial()), InvestmentController.updateInvestment)

// /**
//  * @swagger
//  * /api/investments/{id}:
//  *   delete:
//  *     summary: Delete investment by ID
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investment ID
//  *     responses:
//  *       200:
//  *         description: Investment deleted successfully
//  *       404:
//  *         description: Investment not found
//  */
// router.delete("/:id", authenticate, InvestmentController.deleteInvestment)

// /**
//  * @swagger
//  * /api/investments/{id}/activate:
//  *   put:
//  *     summary: Activate investment
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investment ID
//  *     responses:
//  *       200:
//  *         description: Investment activated successfully
//  *       404:
//  *         description: Investment not found
//  */
// router.put("/:id/activate", authenticate, InvestmentController.activateInvestment)

// /**
//  * @swagger
//  * /api/investments/{id}/complete:
//  *   put:
//  *     summary: Complete investment
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investment ID
//  *     requestBody:
//  *       required: false
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               finalROI:
//  *                 type: number
//  *                 description: Final ROI percentage
//  *     responses:
//  *       200:
//  *         description: Investment completed successfully
//  *       404:
//  *         description: Investment not found
//  */
// router.put("/:id/complete", authenticate, validate(completeInvestmentSchema), InvestmentController.completeInvestment)

// /**
//  * @swagger
//  * /api/investments/{id}/payout:
//  *   post:
//  *     summary: Process payout for investment
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investment ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - payoutAmount
//  *             properties:
//  *               payoutAmount:
//  *                 type: number
//  *                 description: Amount to be paid out
//  *     responses:
//  *       200:
//  *         description: Payout processed successfully
//  *       404:
//  *         description: Investment not found
//  */
// router.post("/:id/payout", authenticate, validate(processPayoutSchema), InvestmentController.processPayout)

// /**
//  * @swagger
//  * /api/investments/{id}/calculate-payout:
//  *   post:
//  *     summary: Calculate next payout date for investment
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investment ID
//  *     responses:
//  *       200:
//  *         description: Next payout date calculated
//  */
// router.post("/:id/calculate-payout", authenticate, InvestmentController.calculateNextPayoutDate)

// /**
//  * @swagger
//  * /api/investments/investor/{investorId}:
//  *   get:
//  *     summary: Get investments by investor ID
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: investorId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investor ID
//  *     responses:
//  *       200:
//  *         description: List of investor's investments
//  */
// router.get("/investor/:investorId", authenticate, InvestmentController.getInvestmentsByInvestor)

// /**
//  * @swagger
//  * /api/investments/investor/{investorId}/summary:
//  *   get:
//  *     summary: Get investment summary for an investor
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: investorId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investor ID
//  *     responses:
//  *       200:
//  *         description: Investment summary
//  */
// router.get("/investor/:investorId/summary", authenticate, InvestmentController.getInvestorSummary)

// /**
//  * @swagger
//  * /api/investments/farm/{farmId}:
//  *   get:
//  *     summary: Get investments by farm ID
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: farmId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Farm ID
//  *     responses:
//  *       200:
//  *         description: List of farm's investments
//  */
// router.get("/farm/:farmId", authenticate, InvestmentController.getInvestmentsByFarm)

// /**
//  * @swagger
//  * /api/investments/due-payouts:
//  *   get:
//  *     summary: Get investments due for payout processing
//  *     tags: [Investments]
//  *     responses:
//  *       200:
//  *         description: List of investments due for payout
//  */
// router.get("/due-payouts", authenticate, InvestmentController.getDueInvestments)

// /**
//  * @swagger
//  * /api/investments/{farmId}/claim-yield:
//  *   post:
//  *     summary: Claim yield for a specific farm (investor only)
//  *     tags: [Investments]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: farmId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Farm ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - investorId
//  *             properties:
//  *               investorId:
//  *                 type: string
//  *                 description: ID of the investor claiming yield
//  *     responses:
//  *       200:
//  *         description: Yield claimed successfully
//  *       401:
//  *         description: Unauthorized - investor ID required
//  *       400:
//  *         description: No active investments found or no yield available
//  */
// router.post("/:farmId/claim-yield", authenticate, InvestmentController.claimYield)

// /**
//  * @swagger
//  * /api/investments/confirm:
//  *   post:
//  *     summary: Confirm investment payment (webhook)
//  *     tags: [Investments]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - investmentId
//  *             properties:
//  *               investmentId:
//  *                 type: string
//  *                 description: ID of the investment to confirm
//  *               transactionHash:
//  *                 type: string
//  *                 description: Blockchain transaction hash
//  *               contractAddress:
//  *                 type: string
//  *                 description: Blockchain contract address
//  *     responses:
//  *       200:
//  *         description: Investment confirmed successfully
//  *       400:
//  *         description: Investment ID is required
//  *       404:
//  *         description: Investment not found
//  */
// router.post("/confirm", authenticate, validate(confirmInvestmentSchema), InvestmentController.confirmInvestment)

// /**
//  * @swagger
//  * /api/investments/{farmId}/details:
//  *   get:
//  *     summary: Get detailed investment information for a specific farm
//  *     tags: [Investments]
//  *     parameters:
//  *       - in: path
//  *         name: farmId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Farm ID
//  *     responses:
//  *       200:
//  *         description: Detailed investment information for the farm
//  */
// router.get("/:farmId/details", authenticate, InvestmentController.getFarmInvestmentDetails)

// /**
//  * @swagger
//  * /api/investments/portfolio/{investorId}:
//  *   get:
//  *     summary: Get investor portfolio with aggregated metrics per farm
//  *     tags: [Investments]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: investorId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Investor ID
//  *     responses:
//  *       200:
//  *         description: Investor portfolio with aggregated metrics
//  */
// router.get("/portfolio/:investorId", authenticate, InvestmentController.getInvestorPortfolio)

// export default router
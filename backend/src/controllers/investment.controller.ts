// import { Request, Response, NextFunction } from "express"
// import { InvestmentService, CreateInvestmentData } from "../services/investment.service"
// import { AppError } from "../utils/appError"

// export class InvestmentController {
//   /**
//    * Create a new investment
//    * POST /api/investments
//    */
//   static async createInvestment(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const investmentData: CreateInvestmentData = req.body
//       const investment = await InvestmentService.createInvestment(investmentData)

//       res.status(201).json({
//         success: true,
//         message: "Investment created successfully",
//         data: investment
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Get investment by ID
//    * GET /api/investments/:id
//    */
//   static async getInvestmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { id } = req.params
//       const investment = await InvestmentService.getInvestmentById(id)

//       if (!investment) {
//         throw new AppError("Investment not found", 404)
//       }

//       res.status(200).json({
//         success: true,
//         data: investment
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Get all investments with optional filtering
//    * GET /api/investments
//    */
//   static async getInvestments(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const {
//         status,
//         investmentType,
//         investorId,
//         farmId,
//         minAmount,
//         maxAmount,
//         page = "1",
//         limit = "10"
//       } = req.query

//       const filters = {
//         status: typeof status === "string" ? status : undefined,
//         investmentType: typeof investmentType === "string" ? investmentType : undefined,
//         investorId: typeof investorId === "string" ? investorId : undefined,
//         farmId: typeof farmId === "string" ? farmId : undefined,
//         minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
//         maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined
//       }

//       const pageNum = parseInt(page as string, 10)
//       const limitNum = parseInt(limit as string, 10)

//       const result = await InvestmentService.getInvestments(filters, pageNum, limitNum)

//       res.status(200).json({
//         success: true,
//         data: result.investments,
//         pagination: {
//           page: pageNum,
//           limit: limitNum,
//           total: result.total,
//           pages: Math.ceil(result.total / limitNum)
//         }
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Update investment by ID
//    * PUT /api/investments/:id
//    */
//   static async updateInvestment(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { id } = req.params
//       const updateData = req.body
//       const investment = await InvestmentService.updateInvestment(id, updateData)

//       if (!investment) {
//         throw new AppError("Investment not found", 404)
//       }

//       res.status(200).json({
//         success: true,
//         message: "Investment updated successfully",
//         data: investment
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Delete investment by ID
//    * DELETE /api/investments/:id
//    */
//   static async deleteInvestment(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { id } = req.params
//       const deleted = await InvestmentService.deleteInvestment(id)

//       if (!deleted) {
//         throw new AppError("Investment not found", 404)
//       }

//       res.status(200).json({
//         success: true,
//         message: "Investment deleted successfully"
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Activate investment
//    * PUT /api/investments/:id/activate
//    */
//   static async activateInvestment(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { id } = req.params
//       const investment = await InvestmentService.activateInvestment(id)

//       if (!investment) {
//         throw new AppError("Investment not found", 404)
//       }

//       res.status(200).json({
//         success: true,
//         message: "Investment activated successfully",
//         data: investment
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Complete investment
//    * PUT /api/investments/:id/complete
//    */
//   static async completeInvestment(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { id } = req.params
//       const { finalROI } = req.body

//       const investment = await InvestmentService.completeInvestment(id, finalROI)

//       if (!investment) {
//         throw new AppError("Investment not found", 404)
//       }

//       res.status(200).json({
//         success: true,
//         message: "Investment completed successfully",
//         data: investment
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Get investor summary
//    * GET /api/investments/investor/:investorId/summary
//    */
//   static async getInvestorSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { investorId } = req.params
//       const summary = await InvestmentService.getInvestorSummary(investorId)

//       res.status(200).json({
//         success: true,
//         data: summary
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Get investments by investor ID
//    * GET /api/investments/investor/:investorId
//    */
//   static async getInvestmentsByInvestor(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { investorId } = req.params
//       const investments = await InvestmentService.getInvestmentsByInvestor(investorId)

//       res.status(200).json({
//         success: true,
//         data: investments
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Get investments by farm ID
//    * GET /api/investments/farm/:farmId
//    */
//   static async getInvestmentsByFarm(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { farmId } = req.params
//       const investments = await InvestmentService.getInvestmentsByFarm(farmId)

//       res.status(200).json({
//         success: true,
//         data: investments
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Process payout for investment
//    * POST /api/investments/:id/payout
//    */
//   static async processPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { id } = req.params
//       const { payoutAmount } = req.body

//       if (!payoutAmount || payoutAmount <= 0) {
//         throw new AppError("Valid payout amount is required", 400)
//       }

//       const investment = await InvestmentService.processPayout(id, payoutAmount)

//       if (!investment) {
//         throw new AppError("Investment not found", 404)
//       }

//       res.status(200).json({
//         success: true,
//         message: "Payout processed successfully",
//         data: investment
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Calculate next payout date
//    * POST /api/investments/:id/calculate-payout
//    */
//   static async calculateNextPayoutDate(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { id } = req.params
//       const nextPayoutDate = await InvestmentService.calculateNextPayoutDate(id)

//       res.status(200).json({
//         success: true,
//         data: { nextPayoutDate }
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Get due investments for payout processing
//    * GET /api/investments/due-payouts
//    */
//   static async getDueInvestments(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const investments = await InvestmentService.getDueInvestments()

//       res.status(200).json({
//         success: true,
//         data: investments
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Claim yield for a specific farm (investor only)
//    * POST /api/investments/:farmId/claim-yield
//    */
//   static async claimYield(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { farmId } = req.params
//       const investorId = req.body.investorId // Ideally comes from auth middleware

//       if (!investorId) {
//         throw new AppError("Investor ID is required", 401)
//       }

//       const updatedInvestments = await InvestmentService.claimYield(farmId, investorId)

//       res.status(200).json({
//         success: true,
//         message: "Yield claimed successfully",
//         data: updatedInvestments
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Confirm investment (webhook)
//    * POST /api/investments/confirm
//    */
//   static async confirmInvestment(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { transactionHash } = req.body

//       if (!transactionHash) {
//         throw new AppError("Transaction hash is required", 400)
//       }

//       const investment = await InvestmentService.confirmInvestment(transactionHash)

//       if (!investment) {
//         throw new AppError("Investment not found", 404)
//       }

//       res.status(200).json({
//         success: true,
//         message: "Investment confirmed successfully",
//         data: investment
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Get detailed investment information for a specific farm
//    * GET /api/investments/:farmId/details
//    */
//   static async getFarmInvestmentDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { farmId } = req.params
//       const details = await InvestmentService.getFarmInvestmentDetails(farmId)

//       res.status(200).json({
//         success: true,
//         data: details
//       })
//     } catch (error) {
//       next(error)
//     }
//   }

//   /**
//    * Get investor portfolio with aggregated metrics per farm
//    * GET /api/investments/portfolio/:investorId
//    */
//   static async getInvestorPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { investorId } = req.params
//       const portfolio = await InvestmentService.getInvestorPortfolio(investorId)

//       res.status(200).json({
//         success: true,
//         data: portfolio
//       })
//     } catch (error) {
//       next(error)
//     }
//   }
// }
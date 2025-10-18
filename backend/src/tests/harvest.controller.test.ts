import request from "supertest"
import express from "express"
import harvestRoutes from "../routes/harvest.routes"
import { HarvestService } from "../services/harvest.service"
import { authenticate, authorize } from "../middleware/auth.middleware"
import { IHarvest } from "../models/harvest.model"

// Mock the HarvestService
jest.mock("../services/harvest.service")
const mockedHarvestService = HarvestService as jest.Mocked<typeof HarvestService>

// Mock the auth middleware
jest.mock("../middleware/auth.middleware")
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>
const mockedAuthorize = authorize as jest.MockedFunction<typeof authorize>

// Helper function to create mock harvest object
const createMockHarvest = (overrides: Partial<IHarvest> = {}): IHarvest => ({
  _id: "507f1f77bcf86cd799439011" as any,
  id: "harvest123",
  farmId: "507f1f77bcf86cd799439012" as any,
  farmerId: "507f1f77bcf86cd799439013" as any,
  imageUrl: "http://localhost:3000/uploads/harvests/harvest-123.jpg",
  status: "pending",
  submittedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  $assertPopulated: jest.fn(),
  $clearModifiedPaths: jest.fn(),
  $clone: jest.fn(),
  $getAllSubdocs: jest.fn(),
  $getPopulatedDocs: jest.fn(),
  $inc: jest.fn(),
  $isDefault: jest.fn(),
  $isDeleted: jest.fn(),
  $isEmpty: jest.fn(),
  $isModified: jest.fn(),
  $isSelected: jest.fn(),
  $isValidObjectId: jest.fn(),
  $locals: {},
  $markValid: jest.fn(),
  $model: jest.fn(),
  $op: null,
  $populated: jest.fn(),
  $set: jest.fn(),
  $setPopulated: jest.fn(),
  $where: jest.fn(),
  $inc: jest.fn(),
  baseModelName: "Harvest",
  collection: {
    name: "harvests"
  } as any,
  db: {} as any,
  delete: jest.fn(),
  deleteOne: jest.fn(),
  depopulate: jest.fn(),
  directModifiedPaths: jest.fn(),
  equals: jest.fn(),
  errors: {},
  execPopulate: jest.fn(),
  get: jest.fn(),
  getChanges: jest.fn(),
  getOptions: jest.fn(),
  getQuery: jest.fn(),
  increment: jest.fn(),
  invalidate: jest.fn(),
  isDirectModified: jest.fn(),
  isInit: jest.fn(),
  isModified: jest.fn(),
  isNew: false,
  isSelected: jest.fn(),
  markModified: jest.fn(),
  modifiedPaths: jest.fn(),
  ownerDocument: jest.fn(),
  parent: jest.fn(),
  parentArray: jest.fn(),
  populate: jest.fn(),
  populated: jest.fn(),
  remove: jest.fn(),
  replaceOne: jest.fn(),
  save: jest.fn(),
  schema: {} as any,
  scope: jest.fn(),
  set: jest.fn(),
  toJSON: jest.fn(),
  toObject: jest.fn(),
  unmarkModified: jest.fn(),
  update: jest.fn(),
  updateOne: jest.fn(),
  validate: jest.fn(),
  validateSync: jest.fn(),
  ...overrides
})

const app = express()
app.use(express.json())
app.use("/api/harvest", harvestRoutes)

describe("HarvestController", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST /api/harvest - Submit harvest", () => {
    it("should submit harvest successfully for authenticated farmer", async () => {
      // Mock authentication middleware
      mockedAuthenticate.mockImplementation((req, res, next) => {
        ;(req as any).user = { userId: "farmer123", role: "farmer" }
        next()
      })
      mockedAuthorize.mockImplementation(() => (req, res, next) => next())

      // Mock service response
      const mockHarvest = {
        id: "harvest123",
        farmId: "farm123",
        farmerId: "farmer123",
        imageUrl: "http://localhost:3000/uploads/harvests/harvest-123.jpg",
        status: "pending",
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockedHarvestService.createHarvest.mockResolvedValue(mockHarvest)

      const response = await request(app)
        .post("/api/harvest")
        .field("farmId", "farm123")
        .attach("harvestImage", Buffer.from("fake-image-data"), "test.jpg")

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe("Harvest submitted successfully")
      expect(response.body.data).toEqual(mockHarvest)
      expect(mockedHarvestService.createHarvest).toHaveBeenCalledWith({
        farmId: "farm123",
        farmerId: "farmer123",
        imageUrl: expect.stringContaining("/uploads/harvests/")
      })
    })

    it("should reject non-farmer users", async () => {
      // Mock authentication middleware for non-farmer
      mockedAuthenticate.mockImplementation((req, res, next) => {
        ;(req as any).user = { userId: "investor123", role: "investor" }
        next()
      })
      mockedAuthorize.mockImplementation(() => (req, res, next) => {
        res.status(403).json({
          success: false,
          message: "Only farmers can submit harvests"
        })
      })

      const response = await request(app)
        .post("/api/harvest")
        .field("farmId", "farm123")
        .attach("harvestImage", Buffer.from("fake-image-data"), "test.jpg")

      expect(response.status).toBe(403)
      expect(response.body.message).toBe("Only farmers can submit harvests")
    })

    it("should reject unauthenticated users", async () => {
      mockedAuthenticate.mockImplementation((req, res, next) => {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        })
      })

      const response = await request(app)
        .post("/api/harvest")
        .field("farmId", "farm123")
        .attach("harvestImage", Buffer.from("fake-image-data"), "test.jpg")

      expect(response.status).toBe(401)
      expect(response.body.message).toBe("Authentication required")
    })
  })

  describe("GET /api/harvest/pending - Get pending harvests", () => {
    it("should return pending harvests for admin", async () => {
      // Mock authentication middleware for admin
      mockedAuthenticate.mockImplementation((req, res, next) => {
        ;(req as any).user = { userId: "admin123", role: "admin" }
        next()
      })
      mockedAuthorize.mockImplementation(() => (req, res, next) => next())

      // Mock service response
      const mockHarvests = [
        {
          id: "harvest1",
          farmId: "farm1",
          farmerId: "farmer1",
          imageUrl: "http://localhost:3000/uploads/harvests/harvest-1.jpg",
          status: "pending",
          submittedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      mockedHarvestService.getPendingHarvests.mockResolvedValue(mockHarvests)

      const response = await request(app).get("/api/harvest/pending")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockHarvests)
      expect(mockedHarvestService.getPendingHarvests).toHaveBeenCalled()
    })

    it("should reject non-admin users", async () => {
      mockedAuthenticate.mockImplementation((req, res, next) => {
        ;(req as any).user = { userId: "farmer123", role: "farmer" }
        next()
      })
      mockedAuthorize.mockImplementation(() => (req, res, next) => {
        res.status(403).json({
          success: false,
          message: "Only admins can view pending harvests"
        })
      })

      const response = await request(app).get("/api/harvest/pending")

      expect(response.status).toBe(403)
      expect(response.body.message).toBe("Only admins can view pending harvests")
    })
  })

  describe("POST /api/harvest/:id/approve - Approve harvest", () => {
    it("should approve harvest successfully", async () => {
      mockedAuthenticate.mockImplementation((req, res, next) => {
        ;(req as any).user = { userId: "admin123", role: "admin" }
        next()
      })
      mockedAuthorize.mockImplementation(() => (req, res, next) => next())

      const mockHarvest = {
        id: "harvest123",
        farmId: "farm123",
        farmerId: "farmer123",
        imageUrl: "http://localhost:3000/uploads/harvests/harvest-123.jpg",
        status: "approved",
        approvedAt: new Date(),
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockedHarvestService.approveHarvest.mockResolvedValue(mockHarvest)

      const response = await request(app).post("/api/harvest/harvest123/approve")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe("Harvest approved successfully")
      expect(response.body.data).toEqual(mockHarvest)
      expect(mockedHarvestService.approveHarvest).toHaveBeenCalledWith("harvest123")
    })

    it("should return 404 for non-existent harvest", async () => {
      mockedAuthenticate.mockImplementation((req, res, next) => {
        ;(req as any).user = { userId: "admin123", role: "admin" }
        next()
      })
      mockedAuthorize.mockImplementation(() => (req, res, next) => next())

      mockedHarvestService.approveHarvest.mockResolvedValue(null)

      const response = await request(app).post("/api/harvest/nonexistent/approve")

      expect(response.status).toBe(404)
      expect(response.body.message).toBe("Harvest not found")
    })
  })

  describe("POST /api/harvest/:id/reject - Reject harvest", () => {
    it("should reject harvest successfully", async () => {
      mockedAuthenticate.mockImplementation((req, res, next) => {
        ;(req as any).user = { userId: "admin123", role: "admin" }
        next()
      })
      mockedAuthorize.mockImplementation(() => (req, res, next) => next())

      const mockHarvest = {
        id: "harvest123",
        farmId: "farm123",
        farmerId: "farmer123",
        imageUrl: "http://localhost:3000/uploads/harvests/harvest-123.jpg",
        status: "rejected",
        rejectionReason: "Poor quality image",
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockedHarvestService.rejectHarvest.mockResolvedValue(mockHarvest)

      const response = await request(app)
        .post("/api/harvest/harvest123/reject")
        .send({ rejectionReason: "Poor quality image" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe("Harvest rejected successfully")
      expect(response.body.data).toEqual(mockHarvest)
      expect(mockedHarvestService.rejectHarvest).toHaveBeenCalledWith("harvest123", "Poor quality image")
    })
  })

  describe("GET /api/harvest/:farmId - Get harvests by farm", () => {
    it("should return harvests for a farm", async () => {
      const mockHarvests = [
        {
          id: "harvest1",
          farmId: "farm123",
          farmerId: "farmer123",
          imageUrl: "http://localhost:3000/uploads/harvests/harvest-1.jpg",
          status: "approved",
          submittedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      mockedHarvestService.getHarvestsByFarmId.mockResolvedValue(mockHarvests)

      const response = await request(app).get("/api/harvest/farm123")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockHarvests)
      expect(mockedHarvestService.getHarvestsByFarmId).toHaveBeenCalledWith("farm123", undefined)
    })

    it("should filter harvests by status", async () => {
      const mockHarvests = []
      mockedHarvestService.getHarvestsByFarmId.mockResolvedValue(mockHarvests)

      const response = await request(app).get("/api/harvest/farm123?status=pending")

      expect(response.status).toBe(200)
      expect(mockedHarvestService.getHarvestsByFarmId).toHaveBeenCalledWith("farm123", "pending")
    })
  })

  describe("GET /api/harvest/:id - Get harvest by ID", () => {
    it("should return harvest details", async () => {
      const mockHarvest = {
        id: "harvest123",
        farmId: "farm123",
        farmerId: "farmer123",
        imageUrl: "http://localhost:3000/uploads/harvests/harvest-123.jpg",
        status: "approved",
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockedHarvestService.getHarvestById.mockResolvedValue(mockHarvest)

      const response = await request(app).get("/api/harvest/harvest123")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockHarvest)
      expect(mockedHarvestService.getHarvestById).toHaveBeenCalledWith("harvest123")
    })

    it("should return 404 for non-existent harvest", async () => {
      mockedHarvestService.getHarvestById.mockResolvedValue(null)

      const response = await request(app).get("/api/harvest/nonexistent")

      expect(response.status).toBe(404)
      expect(response.body.message).toBe("Harvest not found")
    })
  })

  describe("DELETE /api/harvest/:id - Delete harvest", () => {
    it("should delete harvest successfully", async () => {
      mockedAuthenticate.mockImplementation((req, res, next) => {
        ;(req as any).user = { userId: "admin123", role: "admin" }
        next()
      })
      mockedAuthorize.mockImplementation(() => (req, res, next) => next())

      mockedHarvestService.deleteHarvest.mockResolvedValue(true)

      const response = await request(app).delete("/api/harvest/harvest123")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe("Harvest deleted successfully")
      expect(mockedHarvestService.deleteHarvest).toHaveBeenCalledWith("harvest123")
    })

    it("should return 404 for non-existent harvest", async () => {
      mockedAuthenticate.mockImplementation((req, res, next) => {
        ;(req as any).user = { userId: "admin123", role: "admin" }
        next()
      })
      mockedAuthorize.mockImplementation(() => (req, res, next) => next())

      mockedHarvestService.deleteHarvest.mockResolvedValue(false)

      const response = await request(app).delete("/api/harvest/nonexistent")

      expect(response.status).toBe(404)
      expect(response.body.message).toBe("Harvest not found")
    })
  })
})
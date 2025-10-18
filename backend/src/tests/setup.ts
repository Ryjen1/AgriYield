// Test setup file
import { jest } from "@jest/globals"

// Mock environment variables for tests
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-jwt-secret"
process.env.JWT_EXPIRY = "24h"
process.env.MONGODB_URI = "mongodb://localhost:27017/agriyield-test"
process.env.FRONTEND_URL = "http://localhost:3000"

// Global test timeout
jest.setTimeout(10000)

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
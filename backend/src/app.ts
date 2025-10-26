import express from "express"
import cors from "cors"
import helmet from "helmet"
import { initializeMagic } from "./config/magic"
import farmRoutes from "./routes/farm.routes"
// import investmentRoutes from "./routes/investment.routes"
import authRoutes from "./routes/auth.routes"
import adminRoutes from "./routes/admin.routes"
import { setupSwagger } from "./config/swagger"
import { errorHandler } from "./middleware/errorHandler.middleware"
import { initializeBlockchainService } from "./services/blockchain.services"
import { testBlockchainConnection } from "./config/blockchain.config"
import { initializeEventSync } from "./services/event-sync.service"

initializeMagic()
const app = express();


(async () => {
  initializeBlockchainService()
  initializeEventSync()
  await testBlockchainConnection()
})()
app.set("trust proxy", 1)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
)

// Body parsing
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.originalUrl
  const ip = req.ip || req.connection.remoteAddress

  console.log(`${timestamp} - ${method} ${url} - IP: ${ip}`)
  if ((method === "POST" || method === "PUT") && req.body) {
    const logBody = { ...req.body }
    const sensitiveFields = [
      "password",
      "currentPassword",
      "newPassword",
      "confirmPassword",
      "token",
      "apiKey",
      "secret",
      "magicToken",
    ]
    sensitiveFields.forEach((field) => {
      if (logBody[field]) logBody[field] = "[REDACTED]"
    })

    console.log(`Request Body: ${JSON.stringify(logBody, null, 2)}`)
  }

  next()
})

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  next()
})

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Routes
app.use("/api/farms", farmRoutes)
// app.use("/api/investments", investmentRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)

setupSwagger(app)

// Handle undefined routes
app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Route not found" });
});


// Global error handler
app.use(errorHandler)

export default app

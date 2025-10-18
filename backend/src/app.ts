import express from "express"
import cors from "cors"
import helmet from "helmet"
import path from "path"
// import { initializeBlockchain } from "./config/blockchain"
// import { initializeMagic } from "./config/magic"

// Import routes
import farmRoutes from "./routes/farm.routes"
import investmentRoutes from "./routes/investment.routes"
import harvestRoutes from "./routes/harvest.routes"


// (async () => {
//   await initializeBlockchain()
// })()
// initializeMagic()

const app = express()

app.set('trust proxy', 1)
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
  }),
)





// Body parsing with size limits
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Request logging middleware (sanitized)
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
    ]
    sensitiveFields.forEach((field) => {
      if (logBody[field]) logBody[field] = "[REDACTED]"
    })

    console.log(`Request Body: ${JSON.stringify(logBody, null, 2)}`)
  }

  next()
})

const securityHeaders = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  next()
}

app.use(securityHeaders)

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

// API Routes
app.use("/api/farms", farmRoutes)
app.use("/api/investments", investmentRoutes)
app.use("/api/harvest", harvestRoutes)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err)

  const isDevelopment = process.env.NODE_ENV === "development"

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : "Internal server error",
    ...(isDevelopment && { stack: err.stack }),
  })
})

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

export default app
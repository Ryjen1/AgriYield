import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import { Express } from "express"
import { envConfig } from "./env"

const serverUrl = process.env.API_BASE_URL || `http://localhost:${envConfig.PORT}/api`

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AgriVest API",
      version: "1.0.0",
      description:
        "API documentation for AgriVest — blockchain-powered agriculture investment platform that connects **farmers and investors** through farm tokenization.",
    },
    servers: [
      {
        url: serverUrl,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)


export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  console.log(`Swagger docs available at: http://localhost:${envConfig.PORT}/api-docs`)
}

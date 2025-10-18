import multer from "multer"
import path from "path"
import { Request } from "express"

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/harvests/")
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "harvest-" + uniqueSuffix + path.extname(file.originalname))
  }
})

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    // Check file extension
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    const fileExtension = path.extname(file.originalname).toLowerCase()

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true)
    } else {
      cb(new Error("Only image files (.jpg, .jpeg, .png, .gif, .webp) are allowed"))
    }
  } else {
    cb(new Error("Only image files are allowed"))
  }
}

// Configure multer
export const uploadHarvestImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
})

// Middleware to handle upload errors
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size allowed is 5MB."
      })
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Only one file can be uploaded at a time."
      })
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field."
      })
    }
  }

  if (error.message.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }

  next(error)
}

// Helper function to get uploaded file URL
export const getUploadedFileUrl = (req: Request): string | null => {
  if (req.file) {
    // In production, you might want to use a cloud storage URL
    // For now, we'll use a local path
    const protocol = req.protocol
    const host = req.get("host")
    return `${protocol}://${host}/uploads/harvests/${req.file.filename}`
  }
  return null
}
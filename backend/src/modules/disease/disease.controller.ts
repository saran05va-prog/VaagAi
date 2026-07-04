import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { optionalAuth, AuthRequest } from '../auth/auth.middleware'
import { pythonApiCall } from '../../services/python_api'

const router = Router()

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'disease')
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'))
    }
  }
})

// POST /api/disease/analyze - Analyze crop disease
router.post('/analyze', optionalAuth, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded' })
      return
    }

    const { crop_name, location } = req.body
    if (!crop_name) {
      res.status(400).json({ error: 'crop_name is required' })
      return
    }

    // Read image file
    const imageBuffer = fs.readFileSync(req.file.path)
    const base64Image = imageBuffer.toString('base64')
    const mimeType = req.file.mimetype

    // Call Python disease analysis service
    const result = await pythonApiCall('disease/analyze', {
      image: base64Image,
      mime_type: mimeType,
      crop_name,
      location: location || 'Unknown'
    })

    // Clean up uploaded file
    fs.unlinkSync(req.file.path)

    res.json(result)
  } catch (error) {
    console.error('Disease analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze image' })
  }
})

// GET /api/disease/history - Get disease history
router.get('/history', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const limit = parseInt(req.query.limit as string) || 20
    const skip = parseInt(req.query.skip as string) || 0

    // Call Python service
    const result = await pythonApiCall('disease/history', {
      user_id: userId,
      limit,
      skip
    })

    res.json(result)
  } catch (error) {
    console.error('Get history error:', error)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

// DELETE /api/disease/history/:recordId - Delete history record
router.delete('/history/:recordId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recordId } = req.params
    const userId = req.user?.userId

    const result = await pythonApiCall('disease/history/delete', {
      user_id: userId,
      record_id: recordId
    })

    res.json(result)
  } catch (error) {
    console.error('Delete history error:', error)
    res.status(500).json({ error: 'Failed to delete record' })
  }
})

export default router
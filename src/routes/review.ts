import express from 'express'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { ReviewController } from '../controllers/review'
import { isUser } from '../middleware/isUser'
import {
  addReviewValidation,
  getAllReviewsValidation
} from '../utils/validation'

const reviewRouter = express.Router()
const controller = new ReviewController()

reviewRouter.post('/', authenticateAccessToken, isUser, async (req, res) => {
  const { error } = addReviewValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.addReview(req.body, req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

reviewRouter.get('/all', authenticateAccessToken, async (req, res) => {
  const { error } = getAllReviewsValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const { page = '1', limit = '3' } = req.query
    const response = await controller.getReviews(
      parseInt(page as string),
      parseInt(limit as string),
      req
    )
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

reviewRouter.put(
  '/update',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const { error } = addReviewValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.updateReview(req.body, req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default reviewRouter

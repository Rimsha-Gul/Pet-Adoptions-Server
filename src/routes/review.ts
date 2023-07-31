import express from 'express'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { ReviewController } from '../controllers/review'
import { isUser } from '../middleware/isUser'
import { addReviewValidation } from '../utils/validation'

const reviewRouter = express.Router()
const controller = new ReviewController()

reviewRouter.post('/', authenticateAccessToken, isUser, async (req, res) => {
  console.log(req.body)
  const { error } = addReviewValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.addReview(req.body, req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

export default reviewRouter

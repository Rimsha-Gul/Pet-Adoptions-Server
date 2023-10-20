import express from 'express'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { ReviewController } from '../controllers/review'
import { isUser } from '../middleware/isUser'
import {
  addReviewValidation,
  getAllReviewsValidation,
  shelterIDValidation
} from '../utils/validation'

const reviewRouter = express.Router()
const controller = new ReviewController()

reviewRouter.post(
  '/:shelterID',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const { error } = addReviewValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    const idError = shelterIDValidation(req.params).error
    const reviewsError = addReviewValidation(req.body).error

    if (idError || reviewsError) {
      return res
        .status(400)
        .send(
          idError
            ? idError.details[0].message
            : reviewsError?.details[0].message
        )
    }
    try {
      const shelterID = req.params.shelterID as string
      const response = await controller.addReview(shelterID, req.body, req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

reviewRouter.get('/:shelterID', authenticateAccessToken, async (req, res) => {
  const idError = shelterIDValidation(req.params).error
  const reviewsError = getAllReviewsValidation(req.query).error

  if (idError || reviewsError) {
    return res
      .status(400)
      .send(
        idError ? idError.details[0].message : reviewsError?.details[0].message
      )
  }
  try {
    const shelterID = req.params.shelterID as string
    const { page = '1', limit = '3' } = req.query
    const response = await controller.getReviews(
      shelterID,
      parseInt(page as string),
      parseInt(limit as string)
    )
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

reviewRouter.put(
  '/:shelterID',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const idError = shelterIDValidation(req.params).error
    const reviewsError = addReviewValidation(req.body).error

    if (idError || reviewsError) {
      return res
        .status(400)
        .send(
          idError
            ? idError.details[0].message
            : reviewsError?.details[0].message
        )
    }
    try {
      const shelterID = req.params.shelterID as string
      const response = await controller.updateReview(shelterID, req.body, req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default reviewRouter

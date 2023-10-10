import express from 'express'
import { ReactivationRequestController } from '../controllers/reactivationRequest'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { isUser } from '../middleware/isUser'
import {
  applicationIDValidation,
  requestReactivationValidation
} from '../utils/validation'

const reactivationRequestRouter = express.Router()
const controller = new ReactivationRequestController()

reactivationRequestRouter.post(
  '/',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const { error } = requestReactivationValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.requestReactivation(req.body)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

reactivationRequestRouter.get(
  '/',
  authenticateAccessToken,
  async (req, res) => {
    const { error } = applicationIDValidation(req.query)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const applicationID = req.query.applicationID as string
      const response = await controller.getReactivationRequest(applicationID)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default reactivationRequestRouter

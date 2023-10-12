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
  '/:applicationID',
  authenticateAccessToken,
  isUser,
  async (req, res) => {
    const idError = applicationIDValidation(req.params).error
    const requestError = requestReactivationValidation(req.body).error

    if (idError || requestError) {
      return res
        .status(400)
        .send(
          idError
            ? idError.details[0].message
            : requestError?.details[0].message
        )
    }
    try {
      const applicationID = req.params.applicationID as string
      const response = await controller.requestReactivation(
        applicationID,
        req.body
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

reactivationRequestRouter.get(
  '/:applicationID',
  authenticateAccessToken,
  async (req, res) => {
    const { error } = applicationIDValidation(req.params)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const applicationID = req.params.applicationID as string
      const response = await controller.getReactivationRequest(applicationID)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default reactivationRequestRouter

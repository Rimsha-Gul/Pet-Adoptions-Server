import express from 'express'
import { ApplicationController } from '../controllers/application'
import {
  applyForPetValidation,
  getApplicationValidation,
  scheduleHomeVisitValidation
} from '../utils/validation'
import { authenticateAccessToken } from '../middleware/authenticateToken'

const applicationRouter = express.Router()
const controller = new ApplicationController()

applicationRouter.post('/', authenticateAccessToken, async (req, res) => {
  const { error } = applyForPetValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.applyForAPet(req.body, req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

applicationRouter.get('/', authenticateAccessToken, async (req, res) => {
  const { error } = getApplicationValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.getApplicationDetails(req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

applicationRouter.get(
  '/applications',
  authenticateAccessToken,
  async (req, res) => {
    try {
      const response = await controller.getApplications(req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

applicationRouter.post(
  '/scheduleHomeVisit',
  authenticateAccessToken,
  async (req, res) => {
    const { error } = scheduleHomeVisitValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.scheduleHomeVisit(req.body)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default applicationRouter

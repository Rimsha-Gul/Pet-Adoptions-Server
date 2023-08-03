import express from 'express'
import { ShelterController } from '../controllers/shelter'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { emailValidation, idValidation } from '../utils/validation'
import { isShelter } from '../middleware/isShelter'
import { isAdmin } from '../middleware/isAdmin'
import { isUser } from '../middleware/isUser'

const shelterRouter = express.Router()
const controller = new ShelterController()

shelterRouter.get('/', authenticateAccessToken, isUser, async (req, res) => {
  const { error } = idValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.getShelter(req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

shelterRouter.get(
  '/application',
  authenticateAccessToken,
  isShelter,
  async (req, res) => {
    const { error } = idValidation(req.query)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.getApplicationDetails(req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

shelterRouter.post(
  '/invite',
  authenticateAccessToken,
  isAdmin,
  async (req, res) => {
    const { error } = emailValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.inviteShelter(req.body, req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default shelterRouter

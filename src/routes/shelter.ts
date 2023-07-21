import express from 'express'
import { ShelterController } from '../controllers/shelter'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { getApplicationValidation } from '../utils/validation'
import { isShelter } from '../middleware/isShelter'

const shelterRouter = express.Router()
const controller = new ShelterController()

shelterRouter.get(
  '/application',
  authenticateAccessToken,
  isShelter,
  async (req, res) => {
    const { error } = getApplicationValidation(req.query)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.getApplicationDetails(req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default shelterRouter

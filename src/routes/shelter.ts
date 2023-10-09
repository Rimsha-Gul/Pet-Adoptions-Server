import express from 'express'
import { ShelterController } from '../controllers/shelter'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import {
  emailValidation,
  idValidation,
  verifyInvitationTokenValidation
} from '../utils/validation'
import { isShelter } from '../middleware/isShelter'
import { isAdmin } from '../middleware/isAdmin'

const shelterRouter = express.Router()
const controller = new ShelterController()

shelterRouter.get('/', authenticateAccessToken, async (req, res) => {
  const { error } = idValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const id = req.query.id as string
    const response = await controller.getShelter(req, id)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

shelterRouter.get(
  '/all',
  authenticateAccessToken,
  isAdmin,
  async (req, res) => {
    try {
      const response = await controller.getShelters(req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

shelterRouter.get(
  '/application',
  authenticateAccessToken,
  isShelter,
  async (req, res) => {
    const { error } = idValidation(req.query)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const id = req.query.id as string
      const response = await controller.getApplicationDetails(req, id)
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
      const response = await controller.inviteShelter(req.body)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

shelterRouter.get('/verifyInvitationToken', async (req, res) => {
  const { error } = verifyInvitationTokenValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const invitationToken = req.query.invitationToken as string
    const response = await controller.verifyInvitationToken(invitationToken)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err)
  }
})

export default shelterRouter

import express from 'express'
import { ShelterController } from '../controllers/shelter'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import {
  applicationIDValidation,
  emailValidation,
  shelterIDValidation,
  verifyInvitationTokenValidation
} from '../utils/validation'
import { isShelter } from '../middleware/isShelter'
import { isAdmin } from '../middleware/isAdmin'

const shelterRouter = express.Router()
const controller = new ShelterController()

shelterRouter.get('/', authenticateAccessToken, isAdmin, async (req, res) => {
  try {
    const response = await controller.getShelters(req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

shelterRouter.get(
  '/applications/:applicationID',
  authenticateAccessToken,
  isShelter,
  async (req, res) => {
    const { error } = applicationIDValidation(req.params)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const applicationID = req.params.applicationID as string
      const response = await controller.getApplicationDetails(
        req,
        applicationID
      )
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

shelterRouter.post(
  '/invitations',
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

shelterRouter.get('/invitations/token/verification', async (req, res) => {
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

shelterRouter.get('/:shelterID', authenticateAccessToken, async (req, res) => {
  const { error } = shelterIDValidation(req.params)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const shelterID = req.params.shelterID as string
    const response = await controller.getShelter(req, shelterID)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

export default shelterRouter

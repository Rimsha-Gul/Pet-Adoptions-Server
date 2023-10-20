import express from 'express'
import { NotificationController } from '../controllers/notification'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import {
  getAllNotificationsValidation,
  idValidation
} from '../utils/validation'

const notificationRouter = express.Router()
const controller = new NotificationController()

notificationRouter.get('/', authenticateAccessToken, async (req, res) => {
  try {
    const { error } = getAllNotificationsValidation(req.query)
    if (error) return res.status(400).send(error.details[0].message)

    const { page = '1', limit = '8' } = req.query
    const response = await controller.getallNotifications(
      parseInt(page as string),
      parseInt(limit as string),
      req
    )
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

notificationRouter.put(
  '/:notificationID/read',
  authenticateAccessToken,
  async (req, res) => {
    const notificationID = req.params.notificationID as string
    const { error } = idValidation({ id: notificationID })
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.markAsRead(notificationID)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default notificationRouter

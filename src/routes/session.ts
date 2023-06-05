import express from 'express'
import { SessionController } from '../controllers/session'
import { authenticateAccessToken } from '../middleware/authenticateToken'

const sessionRouter = express.Router()
const controller = new SessionController()

sessionRouter.get('/', authenticateAccessToken, async (req, res) => {
  try {
    const response = await controller.session(req)
    res.send(response)
  } catch (err: any) {
    res.status(err.code).send(err.message)
  }
})

export default sessionRouter

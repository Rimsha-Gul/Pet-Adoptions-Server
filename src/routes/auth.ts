import express from 'express'
import { AuthController } from '../controllers/auth'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { signUpValidation, loginValidation } from '../utils/validation'

const authRouter = express.Router()
const controller = new AuthController()

authRouter.post('/signup', async (req, res) => {
  const { error } = signUpValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.signup(req.body)
    return res.send(response)
  } catch (err: any) {
    return res.status(409).send(err.message)
  }
})

authRouter.post('/verifyEmail', async (req, res) => {
  try {
    const response = await controller.verifyEmail(req.body)
    return res.send(response)
  } catch (err: any) {
    return res.status(403).send(err.message)
  }
})

authRouter.post('/resendCode', async (req, res) => {
  try {
    console.log(req.body)
    const response = await controller.resendCode(req.body)
    return res.send(response)
  } catch (err: any) {
    return res.status(403).send(err.message)
  }
})

authRouter.post('/login', async (req, res) => {
  const { error } = loginValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.login(req.body)
    return res.send(response)
  } catch (err: any) {
    console.log(err)
    if (err === 'User not found') {
      return res.status(404).send('User not found')
    } else if (err === 'Invalid credentials') {
      return res.status(401).send('Invalid credentials')
    } else if (err === 'User not verified') {
      return res.status(401).send('User not verified')
    } else {
      return res.status(500).send('Internal server error')
    }
  }
})

authRouter.delete('/logout', authenticateAccessToken, async (req, res) => {
  try {
    const response = await controller.logout(req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

export default authRouter

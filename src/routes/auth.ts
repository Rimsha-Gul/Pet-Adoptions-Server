import express from 'express'
import { AuthController } from '../controllers/auth'
import {
  authenticateAccessToken,
  authenticateRefreshToken
} from '../middleware/authenticateToken'
import {
  signUpValidation,
  loginValidation,
  changeEmailValidation,
  checkPasswordValidation,
  updateProfileValidation
} from '../utils/validation'
import { isAdmin } from '../middleware/isAdmin'
import { conditionalAuthenticateAccessToken } from '../middleware/conditionalAuthenticateToken'
import upload from '../middleware/uploadFiles'
import { uploadFiles } from '../utils/uploadFiles'

const authRouter = express.Router()
const controller = new AuthController()

authRouter.post('/signup', async (req, res) => {
  const { error } = signUpValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.signup(req.body)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.post('/verifyEmail', async (req, res) => {
  try {
    const response = await controller.verifyEmail(req.body)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.post(
  '/sendVerificationCode',
  conditionalAuthenticateAccessToken,
  async (req, res) => {
    try {
      console.log(req.body)
      const response = await controller.sendVerificationCode(req.body, req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

authRouter.post('/refresh', authenticateRefreshToken, async (req, res) => {
  try {
    console.log('in refresh')
    const response = await controller.refresh(req)
    return res.send(response)
  } catch (err: any) {
    console.log(err.code)
    console.log(err.message)
    return res.status(err.code).send(err.message)
  }
})

authRouter.post('/login', async (req, res) => {
  const { error } = loginValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.login(req.body)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.put(
  '/updateProfile',
  authenticateAccessToken,
  upload.single('profilePhoto'),
  async (req, res) => {
    const { error } = updateProfileValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      console.log('try to upload')
      let fileIds: string[] = []
      console.log(req.file)
      const { address, bio, removeProfilePhoto } = req.body

      if (removeProfilePhoto) {
        // Handle removing the profile photo here and return
        const response = await controller.updateProfile(
          req,
          address,
          bio,
          [] // Pass an empty string to remove photo
        )
        return res.send(response)
      }

      if (req.file) {
        fileIds = await uploadFiles([req.file], req)
        console.log(fileIds)
        const response = await controller.updateProfile(
          req,
          address,
          bio,
          fileIds
        )
        return res.send(response)
      }

      const response = await controller.updateProfile(req, address, bio)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

authRouter.get('/checkEmail', authenticateAccessToken, async (req, res) => {
  const { error } = changeEmailValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    console.log('Check controller')
    const response = await controller.checkEmail(req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.put('/changeEmail', authenticateAccessToken, async (req, res) => {
  const { error } = changeEmailValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.changeEmail(req.body, req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.post('/checkPassword', authenticateAccessToken, async (req, res) => {
  const { error } = checkPasswordValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.checkPassword(req.body, req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.put('/changePassword', authenticateAccessToken, async (req, res) => {
  const { error } = checkPasswordValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.changePassword(req.body, req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
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

authRouter.get(
  '/shelters',
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

export default authRouter

import express from 'express'
import { AuthController } from '../controllers/auth'
import {
  authenticateAccessToken,
  authenticateRefreshToken
} from '../middleware/authenticateToken'
import {
  signUpValidation,
  loginValidation,
  emailValidation,
  passwordValidation,
  updateProfileValidation,
  sendVerificationCodeValidation,
  verifyEmailValidation,
  verifyResetTokenValidation,
  resetPasswordValidation
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

authRouter.post(
  '/verificationCode',
  conditionalAuthenticateAccessToken,
  async (req, res) => {
    const { error } = sendVerificationCodeValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.sendVerificationCode(req.body, req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

authRouter.post('/email/verification', async (req, res) => {
  const { error } = verifyEmailValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.verifyEmail(req.body)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.post(
  '/token/refresh',
  authenticateRefreshToken,
  async (req, res) => {
    try {
      const response = await controller.refresh(req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

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
  '/profile',
  authenticateAccessToken,
  upload.single('profilePhoto'),
  async (req, res) => {
    const { name, address, bio, removeProfilePhoto } = req.body
    if (!req.file && !name && !address && !bio && !removeProfilePhoto) {
      return res.status(400).send('At least one field must be provided')
    }

    const { error } = updateProfileValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      let fileIds: string[] = []

      if (removeProfilePhoto) {
        // Handle removing the profile photo
        const response = await controller.updateProfile(
          req,
          name,
          address,
          bio,
          [] // Pass an empty string to remove photo
        )
        return res.send(response)
      }

      if (req.file) {
        fileIds = await uploadFiles([req.file], req)
        const response = await controller.updateProfile(
          req,
          name,
          address,
          bio,
          fileIds
        )
        return res.send(response)
      }

      const response = await controller.updateProfile(req, name, address, bio)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

authRouter.get(
  '/email/availability',
  authenticateAccessToken,
  async (req, res) => {
    const { error } = emailValidation(req.query)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const newEmail = req.query.email as string
      const response = await controller.checkEmail(req, newEmail)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

authRouter.put('/email', authenticateAccessToken, async (req, res) => {
  const { error } = emailValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.changeEmail(req.body, req)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.post(
  '/password/verify',
  authenticateAccessToken,
  async (req, res) => {
    const { error } = passwordValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.verifyPassword(req.body, req)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

authRouter.put('/password', authenticateAccessToken, async (req, res) => {
  const { error } = passwordValidation(req.body)
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

authRouter.post('/password/reset/request', async (req, res) => {
  const { error } = emailValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.requestPasswordReset(req.body)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.get('/password/reset/token/verify', async (req, res) => {
  const { error } = verifyResetTokenValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const resetToken = req.query.resetToken as string
    const response = await controller.VerifyResetToken(resetToken)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.put('/password/reset', async (req, res) => {
  const { error } = resetPasswordValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)
  try {
    const response = await controller.resetPassword(req.body)
    return res.send(response)
  } catch (err: any) {
    return res.status(err.code).send(err.message)
  }
})

authRouter.post(
  '/email/alternate',
  authenticateAccessToken,
  isAdmin,
  async (req, res) => {
    const { error } = emailValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    try {
      const response = await controller.getAlternateEmail(req.body)
      return res.send(response)
    } catch (err: any) {
      return res.status(err.code).send(err.message)
    }
  }
)

export default authRouter

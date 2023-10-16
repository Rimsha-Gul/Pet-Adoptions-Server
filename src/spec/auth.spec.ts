import {
  EmailChangeRequest,
  EmailPayload,
  ResetPasswordPayload,
  Role,
  SendCodePayload,
  User as UserModel
} from '../models/User'
import { generateAccessToken } from '../utils/generateAccessToken'
import { generateRefreshToken } from '../utils/generateRefreshToken'
import { app } from '../app'
import {
  Admin,
  User,
  generateAdminandTokens,
  generateUserandTokens,
  generateUserNotVerifiedandTokens,
  removeAllUsers
} from './utils/generateUserAndToken'
import { mongooseSetUp, dropDatabase, dropCollections } from './utils/setup'
import request from 'supertest'
import * as generateEmailModule from '../utils/generateVerificationCode'
import * as sendEmailModule from '../middleware/sendEmail'
import * as generateResetTokenModule from '../utils/generateResetToken'
import sinon from 'sinon'
import tmp from 'tmp-promise'
import multer from 'multer'
import express from 'express'
import { AuthController } from '../controllers/auth'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import { generateInvitation } from './utils/generateInvitation'
import { generateResetToken } from '../utils/generateResetToken'
import { generateExpiredToken } from './utils/generateExpiredToken'

describe('auth', () => {
  beforeAll(async () => {
    await mongooseSetUp()
  })

  afterEach(async () => {
    await dropCollections()
  })

  afterAll(async () => {
    await dropDatabase()
  })

  describe('signup', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    afterEach(async () => {
      await removeAllUsers()
    })

    it('should respond with user data', async () => {
      const signupData = {
        name: user.name,
        email: 'test1@gmail.com',
        password: '123456',
        role: 'USER'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(200)

      expect(response.body.email).toEqual(signupData.email)
      const createdUser = await UserModel.findOne({ email: signupData.email })
      expect(createdUser).toBeDefined()
      expect(createdUser?.rating).toBeUndefined()
      expect(createdUser?.numberOfReviews).toBeUndefined()
    })

    it('should respond with error if user already exists', async () => {
      const signupData = {
        name: user.name,
        email: user.email,
        password: '123456',
        role: 'USER'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(409)

      expect(response.text).toEqual('User already exists')
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if name is missing', async () => {
      const signupData = {
        email: user.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"name" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is missing', async () => {
      const signupData = {
        name: user.name,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is missing', async () => {
      const signupData = {
        name: user.name,
        email: user.email
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"password" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if name is empty', async () => {
      const signupData = {
        name: '',
        email: user.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"name" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is empty', async () => {
      const signupData = {
        name: user.name,
        email: '',
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"email" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is empty', async () => {
      const signupData = {
        name: user.name,
        email: user.email,
        password: ''
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"password" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if name is number', async () => {
      const signupData = {
        name: 1,
        email: user.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"name" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is number', async () => {
      const signupData = {
        name: user.name,
        email: 1,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is number', async () => {
      const signupData = {
        name: user.name,
        email: user.email,
        password: 1
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"password" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is invalid', async () => {
      const signupData = {
        name: user.name,
        email: 'test@gmailcom',
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a valid email`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if name has length less than 3', async () => {
      const signupData = {
        name: 'Ar',
        email: user.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(
        `"name" length must be at least 3 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if name has length greater than 32', async () => {
      const signupData = {
        name: 'Abcdefghijklmnopqrstuvwxyzabcdefghi',
        email: user.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(
        `"name" length must be less than or equal to 32 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password has length less than 6', async () => {
      const signupData = {
        name: user.name,
        email: user.email,
        password: '12345'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(
        `"password" length must be at least 6 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password has length greater than 32', async () => {
      const longPassword = '1'.repeat(1025)
      const signupData = {
        name: user.name,
        email: user.email,
        password: longPassword
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(
        `"password" length must be less than or equal to 1024 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with user data', async () => {
      await generateInvitation('shelter1@test.com')
      const signupData = {
        name: 'Shelter 1',
        email: 'shelter1@test.com',
        password: '123456',
        role: 'SHELTER'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(200)

      expect(response.body.email).toEqual(signupData.email)
      const user = await UserModel.findOne({ email: signupData.email })
      expect(user).toBeDefined()
      expect(user?.rating).toEqual(0)
      expect(user?.numberOfReviews).toEqual(0)
    })

    it('should respond with Bad Request if shelter does not have an invitation', async () => {
      const signupData = {
        name: user.name,
        email: user.email,
        password: '123456',
        role: 'SHELTER'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual('Invalid invitation')
      expect(response.body).toEqual({})
    })
  })

  describe('requestPasswordReset', () => {
    let user: User
    let payload: EmailPayload
    let generateResetTokenSpy: jest.SpyInstance
    let sendEmailSpy: jest.SpyInstance

    let expectedRecipient
    const expectedSubject = `Purrfect Adoptions - Password Reset Request`
    const expectedMessage = `
    <p>We received a request to reset your password. The password reset window is limited to five minutes.</p>
    <p>If you do not reset your password within five minutes, you will need to submit a new request.</p>
    <p>Please click on the following link to complete the process:</p>
     <p><a href="http://localhost:5173/resetPassword/abc123/">Reset</a></p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `

    beforeEach(async () => {
      user = await generateUserandTokens()
      payload = {
        email: user.email
      }
      // Spy on the generateResetToken function and mock its implementation
      generateResetTokenSpy = jest.spyOn(
        generateResetTokenModule,
        'generateResetToken'
      )
      generateResetTokenSpy.mockImplementation(() => 'abc123')

      // Spy on the sendEmail function
      sendEmailSpy = jest.spyOn(sendEmailModule, 'sendEmail')
      sendEmailSpy.mockImplementation(() => Promise.resolve())
    })

    afterEach(async () => {
      // Clear all mocks after each test
      await removeAllUsers()
      jest.clearAllMocks()
    })

    it('should send reset password email successfully', async () => {
      const response = await request(app)
        .post('/auth/password/reset/request')
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Reset password email sent successfully'
      )
      expect(sendEmailSpy).toBeCalledTimes(1)
      expectedRecipient = payload.email
      expect(sendEmailSpy).toBeCalledWith(
        expectedRecipient,
        expectedSubject,
        expectedMessage
      )
    })

    it('should fail when user does not exist', async () => {
      const invalidEmailPayload = {
        email: 'nonexistent@test.com'
      }

      const response = await request(app)
        .post('/auth/password/reset/request')
        .send(invalidEmailPayload)
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(sendEmailSpy).toBeCalledTimes(0)
      expect(response.body).toEqual({})
    })

    it('should fail when there is an error sending email', async () => {
      sendEmailSpy.mockImplementation(() =>
        Promise.reject(new Error('Email send failed'))
      )

      const response = await request(app)
        .post('/auth/password/reset/request')
        .send(payload)
        .expect(500)

      expect(response.text).toEqual('Error sending reset password email')
      expect(sendEmailSpy).toBeCalledTimes(1)
      expect(response.body).toEqual({})
    })
  })

  describe('verificationCode', () => {
    let user: User
    let payload: SendCodePayload
    let generateVerificationCodeSpy: jest.SpyInstance
    let sendEmailSpy: jest.SpyInstance

    let expectedRecipient
    const expectedSubject = `Purrfect Adoptions - Email Verification`
    const expectedMessage = `<p>Your email verification code is: <strong>123456</strong>.</p><p>Do not share this code with anyone else.</p>`

    beforeEach(async () => {
      user = await generateUserandTokens()
      payload = {
        email: user.email
      }
      // Spy on the generateVerificationCode function and mock its implementation
      generateVerificationCodeSpy = jest.spyOn(
        generateEmailModule,
        'generateVerificationCode'
      )
      generateVerificationCodeSpy.mockImplementation(() => '123456')

      // Spy on the sendEmail function
      sendEmailSpy = jest.spyOn(sendEmailModule, 'sendEmail') // spy on the function from the module
      sendEmailSpy.mockImplementation(() => Promise.resolve())
    })

    afterEach(() => {
      // Clear all mocks after each test
      jest.clearAllMocks()
    })

    it('should send verification code successfully', async () => {
      const testUser = await generateUserNotVerifiedandTokens() // for sending first time (if veriificationCode.code does not exist)
      payload.email = testUser.email
      const response = await request(app)
        .post('/auth/verificationCode')
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual('Signup email sent successfully')
      expect(sendEmailSpy).toBeCalledTimes(1)
      expectedRecipient = payload.email
      expect(sendEmailSpy).toBeCalledWith(
        expectedRecipient,
        expectedSubject,
        expectedMessage
      )
    })

    it('should throw error if user is already verified', async () => {
      const response = await request(app)
        .post('/auth/verificationCode')
        .send(payload)
        .expect(422)

      expect(response.text).toEqual('User already verified')
    })

    it('should handle error when sending verification code', async () => {
      // Mock the sendEmail function to throw an error
      sendEmailSpy.mockImplementation(() => {
        throw new Error('Failed to send email')
      })

      const testUser = await generateUserNotVerifiedandTokens()
      payload.email = testUser.email

      const response = await request(app)
        .post('/auth/verificationCode')
        .send(payload)
        .expect(500)

      expect(response.text).toEqual('Error sending signup email')
    })

    it('should throw an error if user does not exist', async () => {
      payload.email = 'nonexistentuser@test.com' // Assign a non-existent email
      const response = await request(app)
        .post('/auth/verificationCode')
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user data in req.user is invalid', async () => {
      payload.emailChangeRequest = EmailChangeRequest.newEmailStep

      // Send the request without that header.
      const response = await request(app)
        .post('/auth/verificationCode')
        .send(payload)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
      expect(response.body).toEqual({})
    })

    it('should send email change request successfully', async () => {
      payload.emailChangeRequest = EmailChangeRequest.newEmailStep

      const response = await request(app)
        .post('/auth/verificationCode')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Email change request sent successfully'
      )
      expect(sendEmailSpy).toBeCalledTimes(1)
      expectedRecipient = payload.email
      expect(sendEmailSpy).toBeCalledWith(
        expectedRecipient,
        expectedSubject,
        expectedMessage
      )
    })

    it('should respond with Bad Request if email is missing', async () => {
      const incompletePayload = {}
      const response = await request(app)
        .post('/auth/verificationCode')
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is empty', async () => {
      payload.email = ''
      const response = await request(app)
        .post('/auth/verificationCode')
        .send(payload)
        .expect(400)

      expect(response.text).toEqual(`"email" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if emailChangeRequest is string', async () => {
      const incorrectPayload = { email: user.email, emailChangeRequest: 'test' }
      const response = await request(app)
        .post('/auth/verificationCode')
        .send(incorrectPayload)
        .expect(400)

      expect(response.text).toEqual(
        `"emailChangeRequest" must be one of [currentEmailStep, newEmailStep]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if emailChangeRequest is number', async () => {
      const incorrectPayload = { email: user.email, emailChangeRequest: 1 }
      const response = await request(app)
        .post('/auth/verificationCode')
        .send(incorrectPayload)
        .expect(400)

      expect(response.text).toEqual(
        `"emailChangeRequest" must be one of [currentEmailStep, newEmailStep]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is invalid', async () => {
      payload.email = 'test@gmailcom'

      const response = await request(app)
        .post('/auth/verificationCode')
        .send(payload)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a valid email`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is number', async () => {
      const incorrectPayload = { email: 1 }

      const response = await request(app)
        .post('/auth/verificationCode')
        .send(incorrectPayload)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a string`)
      expect(response.body).toEqual({})
    })
  })

  describe('verifyEmail', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should verify email successfully with correct verification code', async () => {
      const payload = {
        email: user.email,
        verificationCode: user.verificationCode.code
      }

      const response = await request(app)
        .post('/auth/email/verification')
        .send(payload)
        .expect(200)

      expect(response.body.isVerified).toBe(true)
      expect(response.body.tokens.accessToken).toBeDefined()
      expect(response.body.tokens.refreshToken).toBeDefined()
    })

    it('should throw an error if user does not exist', async () => {
      const payload = {
        email: 'nonexistentuser@test.com',
        verificationCode: user.verificationCode.code
      }

      const response = await request(app)
        .post('/auth/email/verification')
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if verification code is incorrect', async () => {
      const payload = {
        email: user.email,
        verificationCode: 'incorrect-code'
      }

      const response = await request(app)
        .post('/auth/email/verification')
        .send(payload)
        .expect(400)

      expect(response.text).toEqual('Incorrect verification code')
      expect(response.body).toEqual({})
    })

    it('should throw an error if verification code is expired', async () => {
      const mockUser = {
        email: 'test@example.com',
        verificationCode: {
          code: '123456',
          createdAt: new Date(Date.now() - 2 * 60 * 1000), // Expired verification code (2 minutes ago)
          updatedAt: new Date(Date.now() - 2 * 60 * 1000)
        }
      }
      sinon.stub(UserModel, 'findOne').resolves(mockUser)

      const payload = {
        email: user.email,
        verificationCode: mockUser.verificationCode.code
      }

      const response = await request(app)
        .post('/auth/email/verification')
        .send(payload)
        .expect(401)

      expect(response.text).toEqual('Verification code expired')
      expect(response.body).toEqual({})

      sinon.restore() // Restore the stubbed method
    })

    it('should respond with Bad Request if email is missing', async () => {
      const incompletePayload = { verificationCode: user.verificationCode.code }
      const response = await request(app)
        .post('/auth/email/verification')
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if verificationCode is missing', async () => {
      const incompletePayload = { email: user.email }
      const response = await request(app)
        .post('/auth/email/verification')
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual(`"verificationCode" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is empty', async () => {
      const payload = {
        email: '',
        verificationCode: user.verificationCode.code
      }
      const response = await request(app)
        .post('/auth/email/verification')
        .send(payload)
        .expect(400)

      expect(response.text).toEqual(`"email" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if verificationCode is empty', async () => {
      const payload = {
        email: user.email,
        verificationCode: ''
      }
      const response = await request(app)
        .post('/auth/email/verification')
        .send(payload)
        .expect(400)

      expect(response.text).toEqual(
        `"verificationCode" is not allowed to be empty`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is invalid', async () => {
      const payload = {
        email: 'test@gmailcom',
        verificationCode: user.verificationCode.code
      }

      const response = await request(app)
        .post('/auth/email/verification')
        .send(payload)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a valid email`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is number', async () => {
      const incorrectPayload = {
        email: 1,
        verificationCode: user.verificationCode.code
      }

      const response = await request(app)
        .post('/auth/email/verification')
        .send(incorrectPayload)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if verificationCode is number', async () => {
      const incorrectPayload = { email: user.email, verificationCode: 1 }

      const response = await request(app)
        .post('/auth/email/verification')
        .send(incorrectPayload)
        .expect(400)

      expect(response.text).toEqual(`"verificationCode" must be a string`)
      expect(response.body).toEqual({})
    })
  })

  describe('refresh', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should refresh tokens successfully for a verified user', async () => {
      const response = await request(app)
        .post('/auth/token/refresh')
        .auth(user.tokens.refreshToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.tokens.accessToken).toBeDefined()
      expect(response.body.tokens.refreshToken).toBeDefined()
    })

    it('should throw an error if user does not exist', async () => {
      const invalidRefreshToken = generateRefreshToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const response = await request(app)
        .post('/auth/token/refresh')
        .auth(invalidRefreshToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .post('/auth/token/refresh')
        .auth(newUser.tokens.refreshToken, { type: 'bearer' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
      expect(response.body).toEqual({})
    })

    it('should respond with Unauthorized if token is missing', async () => {
      const response = await request(app)
        .post(`/auth/token/refresh`)
        .expect(401)

      expect(response.text).toEqual(`Unauthorized`)
      expect(response.body).toEqual({})
    })
  })

  describe('get alternate email', () => {
    let user: Admin, payload: EmailPayload

    beforeEach(async () => {
      await generateUserandTokens()
      user = await generateAdminandTokens(Role.Admin)
      payload = {
        email: 'test@gmail.com'
      }
    })

    afterEach(async () => {
      await removeAllUsers()
    })

    it('should successfully notify the user to provide an alternate email', async () => {
      const response = await request(app)
        .post(`/auth/email/alternate`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toBe('User notified successfully')
    })

    it('should throw an error if user does not exist', async () => {
      payload.email = 'nonexistentuser@gmail.com'
      const response = await request(app)
        .post(`/auth/email/alternate`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user is already a shelter', async () => {
      await generateAdminandTokens(Role.Shelter)
      payload.email = 'shelter1@test.com'
      const response = await request(app)
        .post(`/auth/email/alternate`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(409)

      expect(response.text).toEqual('User is already a shelter')
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is missing', async () => {
      const response = await request(app)
        .post(`/auth/email/alternate`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is empty', async () => {
      payload.email = ''
      const response = await request(app)
        .post(`/auth/email/alternate`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toEqual(`"email" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is invalid', async () => {
      payload.email = 'test@gmailcom'
      const response = await request(app)
        .post(`/auth/email/alternate`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a valid email`)
      expect(response.body).toEqual({})
    })

    it('should respond with Unauthorized if token is missing', async () => {
      const response = await request(app)
        .post(`/auth/email/alternate`)
        .send(payload)
        .expect(401)

      expect(response.text).toEqual(`Unauthorized`)
      expect(response.body).toEqual({})
    })

    it('should respond with Permission Denied if shelter tries to perform this task', async () => {
      const shelter = await generateAdminandTokens(Role.Shelter)
      const response = await request(app)
        .post(`/auth/email/alternate`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(403)

      expect(response.text).toEqual(`Permission denied`)
      expect(response.body).toEqual({})
    })

    it('should respond with Permission Denied if user tries to perform this task', async () => {
      const simpleUser = await generateUserandTokens()
      const response = await request(app)
        .post(`/auth/email/alternate`)
        .auth(simpleUser.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(403)

      expect(response.text).toEqual(`Permission denied`)
      expect(response.body).toEqual({})
    })
  })

  describe('checkEmail', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    afterEach(async () => {
      await removeAllUsers()
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentEmailToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )
      const nonExistentEmail = 'nonexistenttest@gmail.com'

      const response = await request(app)
        .get(`/auth/email/availability?email=${nonExistentEmail}`)
        .auth(nonExistentEmailToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .get(`/auth/email/availability?email=${newUser.email}`)
        .auth(newUser.tokens.accessToken, { type: 'bearer' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
      expect(response.body).toEqual({})
    })

    it('should throw an error if email already exists', async () => {
      const response = await request(app)
        .get(`/auth/email/availability?email=${user.email}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(409)

      expect(response.text).toEqual('A user with this email already exists')
      expect(response.body).toEqual({})
    })

    it('should return success message if email is available', async () => {
      const newEmail = 'newTest@gmail.com'

      const response = await request(app)
        .get(`/auth/email/availability?email=${newEmail}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.message).toEqual('Email is available')
    })

    it('should respond with Bad Request if email is missing', async () => {
      const response = await request(app)
        .get(`/auth/email/availability`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is empty', async () => {
      const newEmail = ''
      const response = await request(app)
        .get(`/auth/email/availability?email=${newEmail}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"email" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is invalid', async () => {
      const newEmail = 'test@gmailcom'
      const response = await request(app)
        .get(`/auth/email/availability?email=${newEmail}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"email" must be a valid email`)
      expect(response.body).toEqual({})
    })
  })

  describe('changeEmail', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    afterEach(async () => {
      await removeAllUsers()
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentUserToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const nonExistentEmail = 'nonexistenttest@gmail.com'

      const response = await request(app)
        .put(`/auth/email`)
        .auth(nonExistentUserToken, { type: 'bearer' })
        .send({ email: nonExistentEmail })
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .put(`/auth/email`)
        .auth(newUser.tokens.accessToken, { type: 'bearer' })
        .send({ email: 'new.email@gmail.com' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
      expect(response.body).toEqual({})
    })

    it('should successfully change email if user is verified and email is available', async () => {
      const newEmail = 'new.email@gmail.com'

      const response = await request(app)
        .put(`/auth/email`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ email: newEmail })
        .expect(200)

      expect(response.body.tokens.accessToken).toBeDefined()
      expect(response.body.tokens.refreshToken).toBeDefined()

      const changedUser = await UserModel.findOne({ email: newEmail })
      expect(changedUser).not.toBeNull()
    })

    it('should respond with Bad Request if email is missing', async () => {
      const response = await request(app)
        .put(`/auth/email`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is empty', async () => {
      const newEmail = ''
      const response = await request(app)
        .put(`/auth/email`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ email: newEmail })
        .expect(400)

      expect(response.text).toEqual(`"email" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is invalid', async () => {
      const newEmail = 'test@gmailcom'
      const response = await request(app)
        .put(`/auth/email`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ email: newEmail })
        .expect(400)

      expect(response.text).toEqual(`"email" must be a valid email`)
      expect(response.body).toEqual({})
    })
  })

  describe('checkPassword', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentUserToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const response = await request(app)
        .post('/auth/password/verify')
        .auth(nonExistentUserToken, { type: 'bearer' })
        .send({ password: 'testPassword' })
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .post('/auth/password/verify')
        .auth(newUser.tokens.accessToken, { type: 'bearer' })
        .send({ password: 'testPassword' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
      expect(response.body).toEqual({})
    })

    it('should throw an error if the password is incorrect', async () => {
      const incorrectPassword = 'incorrectPassword'

      const response = await request(app)
        .post('/auth/password/verify')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: incorrectPassword })
        .expect(400)

      expect(response.text).toEqual('Invalid password')
      expect(response.body).toEqual({})
    })

    it('should return a success message if the password is correct', async () => {
      const correctPassword = '123456'
      const response = await request(app)
        .post('/auth/password/verify')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: correctPassword })
        .expect(200)

      expect(response.body.message).toEqual('Password is correct')
    })

    it('should return bad request if the password is a number', async () => {
      const password = 123456
      const response = await request(app)
        .post('/auth/password/verify')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: password })
        .expect(400)

      expect(response.text).toEqual(`"password" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should return bad request if the password is missing', async () => {
      const response = await request(app)
        .post('/auth/password/verify')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"password" is required`)
      expect(response.body).toEqual({})
    })

    it('should return bad request if the password is empty', async () => {
      const password = ''
      const response = await request(app)
        .post('/auth/password/verify')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: password })
        .expect(400)

      expect(response.text).toEqual(`"password" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password has length less than 6', async () => {
      const password = '12345'
      const response = await request(app)
        .post('/auth/password/verify')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: password })
        .expect(400)

      expect(response.text).toEqual(
        `"password" length must be at least 6 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password has length greater than 32', async () => {
      const password = '1'.repeat(1025)
      const response = await request(app)
        .post('/auth/password/verify')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: password })
        .expect(400)

      expect(response.text).toEqual(
        `"password" length must be less than or equal to 1024 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should return bad request if token is mssing', async () => {
      const correctPassword = '123456'
      const response = await request(app)
        .post('/auth/password/verify')
        .send({ password: correctPassword })
        .expect(401)

      expect(response.text).toEqual(`Unauthorized`)
      expect(response.body).toEqual({})
    })
  })

  describe('changePassword', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentUserToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const newPassword = 'newPassword'

      const response = await request(app)
        .put(`/auth/password`)
        .auth(nonExistentUserToken, { type: 'bearer' })
        .send({ password: newPassword })
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .put(`/auth/password`)
        .auth(newUser.tokens.accessToken, { type: 'bearer' })
        .send({ password: 'new.password' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
      expect(response.body).toEqual({})
    })

    it('should successfully change password if user is verified', async () => {
      const newPassword = 'new.password'

      const response = await request(app)
        .put(`/auth/password`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: newPassword })
        .expect(200)

      expect(response.body.message).toEqual('Password changed successfully')

      const updatedUser = await UserModel.findOne({ email: user.email })
      expect(updatedUser).not.toBeNull()

      // Verify that password has changed
      const isMatch = updatedUser?.comparePassword(newPassword)
      expect(isMatch).toEqual(true)
    })

    it('should return bad request if the password is a number', async () => {
      const password = 123456
      const response = await request(app)
        .put('/auth/password')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: password })
        .expect(400)

      expect(response.text).toEqual(`"password" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should return bad request if the password is missing', async () => {
      const response = await request(app)
        .put('/auth/password')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"password" is required`)
      expect(response.body).toEqual({})
    })

    it('should return bad request if the password is empty', async () => {
      const password = ''
      const response = await request(app)
        .put('/auth/password')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: password })
        .expect(400)

      expect(response.text).toEqual(`"password" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password has length less than 6', async () => {
      const password = '12345'
      const response = await request(app)
        .put('/auth/password')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: password })
        .expect(400)

      expect(response.text).toEqual(
        `"password" length must be at least 6 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password has length greater than 32', async () => {
      const password = '1'.repeat(1025)
      const response = await request(app)
        .put('/auth/password')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: password })
        .expect(400)

      expect(response.text).toEqual(
        `"password" length must be less than or equal to 1024 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should return bad request if token is mssing', async () => {
      const correctPassword = '123456'
      const response = await request(app)
        .put('/auth/password')
        .send({ password: correctPassword })
        .expect(401)

      expect(response.text).toEqual(`Unauthorized`)
      expect(response.body).toEqual({})
    })
  })

  describe('login', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should respond with tokens', async () => {
      const loginData = {
        email: user.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('tokens.accessToken')
      expect(response.body).toHaveProperty('tokens.refreshToken')
    })

    it('should respond with Bad Request if password is incorrect', async () => {
      const loginData = {
        email: user.email,
        password: '1234567'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.text).toEqual('Invalid credentials')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const loginData = {
        email: newUser.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(403)

      expect(response.text).toEqual('User not verified')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user does not exist', async () => {
      const loginData = {
        email: 'nonexistent@gmail.com',
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is missing', async () => {
      const loginData = {
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is missing', async () => {
      const loginData = {
        email: user.email
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"password" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is empty', async () => {
      const loginData = {
        email: '',
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"email" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is empty', async () => {
      const loginData = {
        email: user.email,
        password: ''
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"password" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is number', async () => {
      const loginData = {
        email: 1,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is number', async () => {
      const loginData = {
        email: user.email,
        password: 1
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"password" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is invalid', async () => {
      const loginData = {
        email: 'test@gmailcom',
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a valid email`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password has length less than 6', async () => {
      const loginData = {
        email: user.email,
        password: '12345'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(
        `"password" length must be at least 6 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password has length greater than 32', async () => {
      const longPassword = '1'.repeat(1025)
      const loginData = {
        email: user.email,
        password: longPassword
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(
        `"password" length must be less than or equal to 1024 characters long`
      )
      expect(response.body).toEqual({})
    })
  })

  describe('logout', () => {
    it('should respond with success message if logout is successfull', async () => {
      const user: User = await generateUserandTokens()
      const response = await request(app)
        .delete(`/auth/logout`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.message).toEqual('Logout successful')
    })

    it('should respond with Unauthorized if token is missing', async () => {
      const response = await request(app).delete(`/auth/logout`).expect(401)

      expect(response.text).toEqual(`Unauthorized`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if user does not exist', async () => {
      const invalidAccessToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const response = await request(app)
        .delete(`/auth/logout`)
        .auth(invalidAccessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })
  })

  describe('updateProfile', () => {
    // Mock the Google Drive upload functionality
    jest.mock('googleapis', () => {
      const mockDriveFilesCreate = jest
        .fn()
        .mockImplementation((_params, callback) => {
          // Simulate a successful upload by invoking the callback with a mock response
          callback(null, { data: { id: 'mockFileId' } })
        })

      const mockDrive = {
        files: {
          create: mockDriveFilesCreate
        }
      }
      const mockUploadFiles = jest.fn().mockResolvedValue(['mockFileId'])

      return {
        drive: jest.fn(() => mockDrive),
        uploadFiles: mockUploadFiles
      }
    })

    let user: User
    const newName = 'New Name'
    const newAddress = 'New Address'
    const newBio = 'New Bio'

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    afterEach(async () => {
      await removeAllUsers()
      jest.restoreAllMocks()
    })

    it('should successfully update profile photo if new one is provided', async () => {
      const { path: tmpFilePath, cleanup } = await tmp.file({
        postfix: '.jpg'
      })

      const upload = multer({ storage: multer.memoryStorage() }) // Use multer's memory storage
      const controller = new AuthController()

      const server = express()
      server.put(
        '/auth/profile',
        authenticateAccessToken,
        upload.single('profilePhoto'),
        async (req, res) => {
          try {
            // Handle the request here
            const { name, address, bio } = req.body
            if (req.file) {
              if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).send('Only image files are allowed')
              }
            }

            const profilePhotoId = req.file ? ['mockFileId'] : undefined

            const response = await controller.updateProfile(
              req,
              name,
              address,
              bio,
              profilePhotoId
            )
            // Send the response
            return res.send(response)
          } catch (err: any) {
            return res.status(err.code).send(err.message)
          }
        }
      )

      const response = await request(server)
        .put('/auth/profile')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('name', 'New Name')
        .field('address', 'New Address')
        .field('bio', 'New Bio')
        .attach('profilePhoto', tmpFilePath)
        .expect(200)

      expect(response.body.message).toEqual('Profile updated successfully')

      const updatedUser = await UserModel.findOne({ email: user.email })
      expect(updatedUser).not.toBeNull()
      if (updatedUser) {
        expect(updatedUser.profilePhoto).toEqual(['mockFileId'])
        expect(updatedUser.profilePhoto).toHaveLength(1) // Assert that there is exactly one profile photo
      }

      await cleanup() // Delete the temporary file after the test
    })

    it('should throw an error if new profile photo a text file', async () => {
      const { path: tmpFilePath, cleanup } = await tmp.file({
        postfix: '.txt'
      })

      const upload = multer({ storage: multer.memoryStorage() }) // Use multer's memory storage
      const controller = new AuthController()

      const server = express()
      server.put(
        '/auth/profile',
        authenticateAccessToken,
        upload.single('profilePhoto'),
        async (req, res) => {
          try {
            // Handle the request here
            const { name, address, bio } = req.body

            if (req.file) {
              if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).send('Only image files are allowed')
              }
            }

            const profilePhotoId = req.file ? ['mockFileId'] : undefined

            const response = await controller.updateProfile(
              req,
              name,
              address,
              bio,
              profilePhotoId
            )
            // Send the response
            return res.send(response)
          } catch (err: any) {
            return res.status(err.code).send(err.message)
          }
        }
      )

      const response = await request(server)
        .put('/auth/profile')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('name', 'New Name')
        .field('address', 'New Address')
        .field('bio', 'New Bio')
        .attach('profilePhoto', tmpFilePath)
        .expect(400)

      expect(response.text).toEqual('Only image files are allowed')
      expect(response.body).toEqual({})

      await cleanup() // Delete the temporary file after the test
    })

    it('should throw an error if new profile photo is a pdf file', async () => {
      const { path: tmpFilePath, cleanup } = await tmp.file({
        postfix: '.pdf'
      })

      const upload = multer({ storage: multer.memoryStorage() }) // Use multer's memory storage
      const controller = new AuthController()

      const server = express()
      server.put(
        '/auth/profile',
        authenticateAccessToken,
        upload.single('profilePhoto'),
        async (req, res) => {
          try {
            // Handle the request here
            const { name, address, bio } = req.body

            if (req.file) {
              if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).send('Only image files are allowed')
              }
            }

            const profilePhotoId = req.file ? ['mockFileId'] : undefined

            const response = await controller.updateProfile(
              req,
              name,
              address,
              bio,
              profilePhotoId
            )
            // Send the response
            return res.send(response)
          } catch (err: any) {
            return res.status(err.code).send(err.message)
          }
        }
      )

      const response = await request(server)
        .put('/auth/profile')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('name', 'New Name')
        .field('address', 'New Address')
        .field('bio', 'New Bio')
        .attach('profilePhoto', tmpFilePath)
        .expect(400)

      expect(response.text).toEqual('Only image files are allowed')
      expect(response.body).toEqual({})

      await cleanup() // Delete the temporary file after the test
    })

    it('should remove user profile photo if removeProfilePhoto is true', async () => {
      const response = await request(app)
        .put(`/auth/profile`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({
          name: newName,
          address: newAddress,
          bio: newBio,
          removeProfilePhoto: true
        })
        .expect(200)

      expect(response.body.message).toEqual('Profile updated successfully')

      const updatedUser = await UserModel.findOne({ email: user.email })
      expect(updatedUser).not.toBeNull()
      if (updatedUser) {
        expect(updatedUser.name).toEqual(newName)
        expect(updatedUser.address).toEqual(newAddress)
        expect(updatedUser.bio).toEqual(newBio)
        expect(updatedUser.profilePhoto).toEqual([])
      }
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentUserToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const response = await request(app)
        .put(`/auth/profile`)
        .auth(nonExistentUserToken, { type: 'bearer' })
        .send({ name: newName, address: newAddress, bio: newBio })
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should update user profile if user exists and data is valid', async () => {
      const response = await request(app)
        .put(`/auth/profile`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ name: newName, address: newAddress, bio: newBio })
        .expect(200)

      expect(response.body.message).toEqual('Profile updated successfully')

      const updatedUser = await UserModel.findOne({ email: user.email })
      expect(updatedUser).not.toBeNull()
      if (updatedUser) {
        expect(updatedUser.name).toEqual(newName)
        expect(updatedUser.address).toEqual(newAddress)
        expect(updatedUser.bio).toEqual(newBio)
      }
    })

    it('should throw an error if no fields are provided', async () => {
      const response = await request(app)
        .put(`/auth/profile`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({})
        .expect(400)

      expect(response.text).toEqual('At least one field must be provided')
      expect(response.body).toEqual({})
    })

    it('should respond with bad request if name is a number', async () => {
      const invalidNewName = 1
      const response = await request(app)
        .put(`/auth/profile`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ name: invalidNewName, address: newAddress, bio: newBio })
        .expect(400)

      expect(response.text).toEqual(`"name" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with bad request if address is a number', async () => {
      const invalidNewAddress = 1
      const response = await request(app)
        .put(`/auth/profile`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ name: newName, address: invalidNewAddress, bio: newBio })
        .expect(400)

      expect(response.text).toEqual(`"address" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with bad request if bio is a number', async () => {
      const invalidNewBio = 1
      const response = await request(app)
        .put(`/auth/profile`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ name: newName, address: newAddress, bio: invalidNewBio })
        .expect(400)

      expect(response.text).toEqual(`"bio" must be a string`)
      expect(response.body).toEqual({})
    })
  })

  describe('VerifyResetToken', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should verify the reset token successfully', async () => {
      const response = await request(app)
        .get(
          `/auth/password/reset/token/verify?resetToken=${user.passwordResetToken}`
        )
        .expect(200)

      expect(response.body.email).toEqual(user.email)
    })

    it('should fail to verify with expired token', async () => {
      // replace this with your function to generate an expired token
      const expiredToken = generateExpiredToken(user.email)

      const response = await request(app)
        .get(`/auth/password/reset/token/verify?resetToken=${expiredToken}`)
        .expect(400)

      expect(response.text).toEqual('Expired reset token')
    })

    it('should fail to verify with invalid token', async () => {
      const response = await request(app)
        .get(`/auth/password/reset/token/verify?resetToken=invalidToken`)
        .expect(400)

      expect(response.text).toEqual('Invalid reset token')
    })

    it('should fail if user does not exist', async () => {
      const tokenForNonExistentUser = generateResetToken(
        'nonexistent@example.com'
      )

      const response = await request(app)
        .get(
          `/auth/password/reset/token/verify?resetToken=${tokenForNonExistentUser}`
        )
        .expect(404)

      expect(response.text).toEqual('User not found')
    })
  })

  describe('resetPassword', () => {
    let payload: ResetPasswordPayload
    let userEmail: string

    beforeEach(async () => {
      const user = await generateUserandTokens()
      userEmail = user.email

      payload = {
        email: userEmail,
        newPassword: 'NewPassword123!'
      }
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should reset the password successfully', async () => {
      const response = await request(app)
        .put('/auth/password/reset')
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual('Password reset successfully')
    })

    it('should fail to reset password for non-existing user', async () => {
      payload.email = 'non-existing@example.com'

      const response = await request(app)
        .put('/auth/password/reset')
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should fail to reset password for user without reset token', async () => {
      // Remove password reset token from the user
      const updatedUser = await UserModel.findOneAndUpdate(
        { email: userEmail },
        { $unset: { passwordResetToken: '' } },
        { new: true }
      )

      // Verify that the token was removed
      expect(updatedUser).toBeDefined()
      expect(updatedUser?.passwordResetToken).toBeUndefined()

      const response = await request(app)
        .put('/auth/password/reset')
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('No password reset token found')
    })

    it('should fail to reset password with invalid/expired token', async () => {
      // Set expired token for the user
      await UserModel.updateOne(
        { email: userEmail },
        { passwordResetToken: generateExpiredToken(userEmail) }
      )

      const response = await request(app)
        .put('/auth/password/reset')
        .send(payload)
        .expect(400)

      expect(response.text).toEqual('Invalid or expired reset token.')
    })
  })
})

import { User as UserModel, SendCodePayload } from '../models/User'
import { app } from '../app'
import {
  User,
  generateUserNotVerifiedandTokens,
  generateUserandTokens
} from './utils/generateUserAndToken'
import { mongooseSetUp, dropDatabase, dropCollections } from './utils/setup'
import request from 'supertest'
import * as sendEmailModule from '../middleware/sendEmail'
import sinon from 'sinon'

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

    it('should respond with user data', async () => {
      const signupData = {
        name: user.name,
        email: 'test1@gmail.com',
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(200)

      expect(response.body.email).toEqual(signupData.email)
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
  })

  describe('sendVerificationCode', () => {
    let user: User
    let payload: SendCodePayload
    let sendEmailSpy: jest.SpyInstance

    beforeEach(async () => {
      user = await generateUserandTokens()
      payload = {
        email: user.email,
        emailChangeRequest: false
      }
      // Spy on the sendEmail function
      sendEmailSpy = jest.spyOn(sendEmailModule, 'sendEmail') // spy on the function from the module
      sendEmailSpy.mockImplementation(() => Promise.resolve())
    })

    afterEach(() => {
      // Clear all mocks after each test
      jest.clearAllMocks()
    })

    it('should send verification code successfully', async () => {
      const response = await request(app)
        .post('/auth/sendVerificationCode')
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual('Signup email sent successfully')
      expect(sendEmailSpy).toBeCalledTimes(1)
    })

    it('should throw an error if user does not exist', async () => {
      payload.email = 'nonexistentuser@test.com' // Assign a non-existent email
      const response = await request(app)
        .post('/auth/sendVerificationCode')
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should throw an error if user data in req.user is invalid', async () => {
      payload.emailChangeRequest = true

      // Send the request without that header.
      const response = await request(app)
        .post('/auth/sendVerificationCode')
        .send(payload)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })

    it('should send email change request successfully', async () => {
      payload.emailChangeRequest = true

      const response = await request(app)
        .post('/auth/sendVerificationCode')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Email change request sent successfully'
      )
      expect(sendEmailSpy).toBeCalledTimes(1)
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
      console.log(user)
      console.log(payload)

      const response = await request(app)
        .post('/auth/verifyEmail')
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
        .post('/auth/verifyEmail')
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should throw an error if verification code is incorrect', async () => {
      const payload = {
        email: user.email,
        verificationCode: 'incorrect-code'
      }

      const response = await request(app)
        .post('/auth/verifyEmail')
        .send(payload)
        .expect(400)

      expect(response.text).toEqual('Incorrect verification code')
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
        .post('/auth/verifyEmail')
        .send(payload)
        .expect(401)

      expect(response.text).toEqual('Verification code expired')

      sinon.restore() // Restore the stubbed method
    })
  })

  describe('refresh', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should refresh tokens successfully for a verified user', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .auth(user.tokens.refreshToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.tokens.accessToken).toBeDefined()
      expect(response.body.tokens.refreshToken).toBeDefined()
    })

    it('should throw an error if user does not exist', async () => {
      const invalidRefreshToken = 'invalid-refresh-token'
      console.log(invalidRefreshToken)

      const response = await request(app)
        .post('/auth/refresh')
        .auth(invalidRefreshToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .post('/auth/refresh')
        .auth(newUser.tokens.refreshToken, { type: 'bearer' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
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
  })

  describe('logout', () => {
    it('should respond with Unauthorized if token is missing', async () => {
      const response = await request(app).delete(`/auth/logout`).expect(401)

      expect(response.text).toEqual(`Unauthorized`)
      expect(response.body).toEqual({})
    })
  })
})

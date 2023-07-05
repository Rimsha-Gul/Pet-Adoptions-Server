import { SendCodePayload, User as UserModel } from '../models/User'
import { generateAccessToken } from '../utils/generateAccessToken'
import { generateRefreshToken } from '../utils/generateRefreshToken'
import { app } from '../app'
import {
  Admin,
  User,
  generateAdminandTokens,
  generateUserNotVerifiedandTokens,
  generateUserandTokens,
  removeAllUsers
} from './utils/generateUserAndToken'
import { mongooseSetUp, dropDatabase, dropCollections } from './utils/setup'
import request from 'supertest'
import * as sendEmailModule from '../middleware/sendEmail'
import sinon from 'sinon'
import { generateShelters, removeAllShelters } from './utils/generateShelters'
import tmp from 'tmp-promise'
import multer from 'multer'
import fs from 'fs'
import express from 'express'
import { AuthController } from '../controllers/auth'
import { authenticateAccessToken } from '../middleware/authenticateToken'

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
      console.log(user)

      const invalidRefreshToken = generateRefreshToken(
        'rimsha@tetrahex.com',
        'USER'
      )
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

  describe('checkEmail', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentEmailToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )
      const nonExistentEmail = 'nonexistenttest@gmail.com'

      const response = await request(app)
        .get(`/auth/checkEmail?email=${nonExistentEmail}`)
        .auth(nonExistentEmailToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .get(`/auth/checkEmail?email=${newUser.email}`)
        .auth(newUser.tokens.accessToken, { type: 'bearer' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
    })

    it('should throw an error if email already exists', async () => {
      // Generate another user
      const anotherUser = await generateUserandTokens()

      const response = await request(app)
        .get(`/auth/checkEmail?email=${anotherUser.email}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(409)

      expect(response.text).toEqual('A user with this email already exists')
    })

    it('should return success message if email is available', async () => {
      const newEmail = 'newTest@gmail.com'

      const response = await request(app)
        .get(`/auth/checkEmail?email=${newEmail}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.message).toEqual('Email is available')
    })
  })

  describe('changeEmail', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentUserToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const nonExistentEmail = 'nonexistenttest@gmail.com'

      const response = await request(app)
        .put(`/auth/changeEmail`)
        .auth(nonExistentUserToken, { type: 'bearer' })
        .send({ email: nonExistentEmail })
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .put(`/auth/changeEmail`)
        .auth(newUser.tokens.accessToken, { type: 'bearer' })
        .send({ email: 'new.email@gmail.com' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
    })

    it('should successfully change email if user is verified and email is available', async () => {
      const newEmail = 'new.email@gmail.com'

      const response = await request(app)
        .put(`/auth/changeEmail`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ email: newEmail })
        .expect(200)

      expect(response.body.tokens.accessToken).toBeDefined()
      expect(response.body.tokens.refreshToken).toBeDefined()

      const changedUser = await UserModel.findOne({ email: newEmail })
      expect(changedUser).not.toBeNull()
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
        .post('/auth/checkPassword')
        .auth(nonExistentUserToken, { type: 'bearer' })
        .send({ password: 'testPassword' })
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .post('/auth/checkPassword')
        .auth(newUser.tokens.accessToken, { type: 'bearer' })
        .send({ password: 'testPassword' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
    })

    it('should throw an error if the password is incorrect', async () => {
      const incorrectPassword = 'incorrectPassword'

      const response = await request(app)
        .post('/auth/checkPassword')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: incorrectPassword })
        .expect(400)

      expect(response.text).toEqual('Invalid password')
    })

    it('should return a success message if the password is correct', async () => {
      const correctPassword = '123456'
      const response = await request(app)
        .post('/auth/checkPassword')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({ password: correctPassword })
        .expect(200)

      expect(response.body.message).toEqual('Password is correct')
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
        .put(`/auth/changePassword`)
        .auth(nonExistentUserToken, { type: 'bearer' })
        .send({ password: newPassword })
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should throw an error if user is not verified', async () => {
      // Create a new user without verifying
      const newUser = await generateUserNotVerifiedandTokens()

      const response = await request(app)
        .put(`/auth/changePassword`)
        .auth(newUser.tokens.accessToken, { type: 'bearer' })
        .send({ password: 'new.password' })
        .expect(403)

      expect(response.text).toEqual('User not verified')
    })

    it('should successfully change password if user is verified', async () => {
      const newPassword = 'new.password'

      const response = await request(app)
        .put(`/auth/changePassword`)
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

  describe('getShelters', () => {
    let adminUser: Admin

    beforeEach(async () => {
      // Generate shelters
      await generateShelters()

      // Generate an admin user and tokens for testing
      adminUser = await generateAdminandTokens()
    })

    afterEach(async () => {
      // Clean up any existing data
      await removeAllShelters()
    })

    it('should throw an error if the user is not an admin', async () => {
      const user = await generateUserandTokens()

      const response = await request(app)
        .get('/auth/shelters')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(403)

      expect(response.text).toEqual('Permission denied')
    })

    it('should get all shelters successfully if user is an admin', async () => {
      const response = await request(app)
        .get('/auth/shelters')
        .auth(adminUser.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThanOrEqual(1)

      response.body.forEach((shelter: any) => {
        expect(shelter).toHaveProperty('id')
        expect(shelter).toHaveProperty('name')
      })
    })

    it('should return empty list if no shelters', async () => {
      // remove all shelters
      await removeAllShelters()

      const response = await request(app)
        .get(`/auth/shelters`)
        .auth(adminUser.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toEqual(0)
    })

    it('should throw an error if user is not authenticated', async () => {
      const response = await request(app).get(`/auth/shelters`).expect(401)

      expect(response.text).toEqual('Unauthorized')
    })
  })

  describe('updateProfile', () => {
    // Mock the Google Drive upload functionality
    jest.mock('googleapis', () => {
      const mockDriveFilesCreate = jest
        .fn()
        .mockImplementation((_params, callback) => {
          // Simulate a successful upload by invoking the callback with a mock response
          console.log('uploadFiles called with file:')
          callback(null, { data: { id: 'mockFileId' } })
        })

      const mockDrive = {
        files: {
          create: mockDriveFilesCreate
        }
      }
      console.log('uploadFiles called with files:', mockDrive.files)
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
    })

    it('should successfully update profile photo if new one is provided', async () => {
      const { path: tmpFilePath, cleanup } = await tmp.file()
      fs.writeFileSync(tmpFilePath, 'This is a test file')
      const upload = multer({ storage: multer.memoryStorage() }) // Use multer's memory storage
      const controller = new AuthController()

      const server = express()
      server.put(
        '/auth/updateProfile',
        authenticateAccessToken,
        upload.single('profilePhoto'),
        async (req, res) => {
          try {
            // Handle the request here
            const { name, address, bio } = req.body
            console.log('req body: ', req.body)
            console.log('req file: ', req.file)
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
        .put('/auth/updateProfile')
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
      }

      await cleanup() // Delete the temporary file after the test
    })

    it('should remove user profile photo if removeProfilePhoto is true', async () => {
      const response = await request(app)
        .put(`/auth/updateProfile`)
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
      }
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentUserToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const response = await request(app)
        .put(`/auth/updateProfile`)
        .auth(nonExistentUserToken, { type: 'bearer' })
        .send({ name: newName, address: newAddress, bio: newBio })
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should update user profile if user exists and data is valid', async () => {
      const response = await request(app)
        .put(`/auth/updateProfile`)
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
        .put(`/auth/updateProfile`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send({})
        .expect(400)

      expect(response.text).toEqual('At least one field must be provided')
    })

    // it('should successfully update profile photo if new one is provided', async () => {
    //   // This test will be complex due to needing to handle file upload.
    //   // It's highly dependent on your implementation.
    // })
  })
})

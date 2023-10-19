import { app } from '../app'
import { removeAllApplications } from './utils/generateApplication'
import {
  generateNotification,
  generateNotifications,
  removeAllNotifications
} from './utils/generateNotification'
import { generatePetWithApplication, removePets } from './utils/generatePet'
import {
  User,
  generateUserandTokens,
  removeAllUsers
} from './utils/generateUserAndToken'
import { dropCollections, dropDatabase, mongooseSetUp } from './utils/setup'
import request from 'supertest'
import * as socketModule from '../socket'
import { generateAccessToken } from '../utils/generateAccessToken'
import Notification from '../models/Notification'

describe('notification', () => {
  beforeAll(async () => {
    await mongooseSetUp()
  })

  afterEach(async () => {
    await dropCollections()
  })

  afterAll(async () => {
    await dropDatabase()
  })

  describe('mark notification as read', () => {
    let user: User, applicationID, notificationID, socketSpy: jest.SpyInstance

    beforeEach(async () => {
      user = await generateUserandTokens()
      applicationID = await generatePetWithApplication(user.email)
      notificationID = await generateNotification(applicationID)

      socketSpy = jest.spyOn(socketModule, 'emitReadNotification')
      socketSpy.mockImplementation(() => Promise.resolve())
    })

    afterEach(async () => {
      await removeAllUsers()
      await removePets()
      await removeAllApplications()
      await removeAllNotifications()
      jest.clearAllMocks()
    })

    it('should successfully add a review and update the shelter rating', async () => {
      const response = await request(app)
        .put(`/notifications/${notificationID}/read`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.message).toBe(
        'Notification successfully marked as read'
      )
      expect(socketSpy).toHaveBeenCalledTimes(1)
      expect(socketSpy).toHaveBeenCalledWith(user.email, notificationID)
    })

    it('should throw error when notification does not exist corresponding to the given ID', async () => {
      await removeAllNotifications()
      const response = await request(app)
        .put(`/notifications/${notificationID}/read`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toBe('Notification not found')
    })

    it('should throw Bad Request if ID length is less than 24 characters', async () => {
      const response = await request(app)
        .put(`/notifications/12345/read`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toBe('"id" length must be 24 characters long')
    })

    it('should throw Bad Request if ID length is greater than 24 characters', async () => {
      const response = await request(app)
        .put(`/notifications/1234567890123456789012345/read`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toBe('"id" length must be 24 characters long')
    })

    it('should throw Unauthotized if token is missing', async () => {
      const response = await request(app)
        .put(`/notifications/${notificationID}/read`)
        .expect(401)

      expect(response.text).toBe('Unauthorized')
    })
  })

  describe('get all notification', () => {
    let user: User, applicationID

    beforeEach(async () => {
      user = await generateUserandTokens()
      applicationID = await generatePetWithApplication(user.email)
      await generateNotifications(applicationID)
    })

    afterEach(async () => {
      await removeAllUsers()
      await removePets()
      await removeAllApplications()
      await removeAllNotifications()
      jest.clearAllMocks()
    })

    it('should successfully return all notifications for the specified user', async () => {
      const response = await request(app)
        .get('/notifications')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.notifications).toBeInstanceOf(Array)
      expect(response.body.notifications).toHaveLength(5)
    })

    it('should return zero notifications for the specified user', async () => {
      await removeAllNotifications()
      const response = await request(app)
        .get('/notifications')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.notifications).toBeInstanceOf(Array)
      expect(response.body.notifications).toHaveLength(0)
    })

    it('should return Bad Request if page is a string', async () => {
      const response = await request(app)
        .get('/notifications?page=-page')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"page" must be a number')
    })

    it('should return error if user is not found', async () => {
      const nonExistentEmailToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )
      const response = await request(app)
        .get('/notifications')
        .auth(nonExistentEmailToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toBe('User not found')
      expect(response.body).toEqual({})
    })

    it('should return error if token is missing', async () => {
      const response = await request(app).get('/notifications').expect(401)

      expect(response.text).toBe('Unauthorized')
      expect(response.body).toEqual({})
    })

    it('should return 500 when there is an internal server error', async () => {
      jest.spyOn(Notification, 'find').mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      const response = await request(app)
        .get('/notifications')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(500)

      expect(response.text).toEqual('Failed to fetch notifications')
    })
  })
})

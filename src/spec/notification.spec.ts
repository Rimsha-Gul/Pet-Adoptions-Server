import { NotificationPayload } from 'src/models/Notification'
import { app } from '../app'
import { removeAllApplications } from './utils/generateApplication'
import {
  generateNotification,
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
    let user: User,
      applicationID,
      notificationID,
      payload: NotificationPayload,
      socketSpy: jest.SpyInstance

    beforeEach(async () => {
      user = await generateUserandTokens()
      applicationID = await generatePetWithApplication(user.email)
      notificationID = await generateNotification(applicationID)
      payload = {
        id: notificationID
      }

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
        .put('/notification/markAsRead')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
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
        .put('/notification/markAsRead')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toBe('Notification not found')
    })

    it('should throw Bad Request if ID length is less than 24 characters', async () => {
      payload.id = '12345'
      const response = await request(app)
        .put('/notification/markAsRead')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toBe('"id" length must be 24 characters long')
    })

    it('should throw Bad Request if ID length is greater than 24 characters', async () => {
      payload.id = '1234567890123456789012345'
      const response = await request(app)
        .put('/notification/markAsRead')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toBe('"id" length must be 24 characters long')
    })

    it('should throw Bad Request if ID is empty', async () => {
      payload.id = ''
      const response = await request(app)
        .put('/notification/markAsRead')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toBe('"id" is not allowed to be empty')
    })

    it('should throw Bad Request if ID is missing', async () => {
      const invalidPayload = {}
      const response = await request(app)
        .put('/notification/markAsRead')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(invalidPayload)
        .expect(400)

      expect(response.text).toBe('"id" is required')
    })

    it('should throw Unauthotized if token is missing', async () => {
      const response = await request(app)
        .put('/notification/markAsRead')
        .send(payload)
        .expect(401)

      expect(response.text).toBe('Unauthorized')
    })
  })
})

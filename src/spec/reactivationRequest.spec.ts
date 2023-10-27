import { app } from '../app'
import {
  User,
  generateAdminandTokens,
  generateUserandTokens,
  removeAllUsers
} from './utils/generateUserAndToken'
import { dropCollections, dropDatabase, mongooseSetUp } from './utils/setup'
import request from 'supertest'
import { generatePetWithApplication, removePets } from './utils/generatePet'
import ReactivationRequest, {
  ReactivationRequestPayload
} from '../models/ReactivationRequest'
import { removeAllApplications } from './utils/generateApplication'
import { removeAllShelters } from './utils/generateShelters'
import {
  generateReactivationRequest,
  removeAllReactivationRequests
} from './utils/generateReactivationRequest'
import { Role } from '../models/User'
import * as sendEmailModule from '../middleware/sendEmail'

describe('reactivationRequest', () => {
  beforeAll(async () => {
    await mongooseSetUp()
  })

  afterEach(async () => {
    await dropCollections()
  })

  afterAll(async () => {
    await dropDatabase()
  })

  describe('create reactivation request', () => {
    let user: User,
      applicationID,
      payload: ReactivationRequestPayload,
      sendEmailSpy: jest.SpyInstance

    beforeEach(async () => {
      user = await generateUserandTokens()
      applicationID = await generatePetWithApplication(user.email)
      payload = {
        reasonNotScheduled:
          'I had an unexpected personal commitment that consumed my attention during that time, and I missed the scheduling window.',
        reasonToReactivate:
          'The commitment has been addressed, and I am now fully available to proceed with the visit scheduling.'
      }

      // Spy on the sendEmail function
      sendEmailSpy = jest.spyOn(sendEmailModule, 'sendEmail')
      sendEmailSpy.mockImplementation(() => Promise.resolve())
    })

    afterEach(async () => {
      await removeAllUsers()
      await removePets()
      await removeAllApplications()
      await removeAllReactivationRequests()
      jest.restoreAllMocks()
    })

    it('should successfully create reactivation request and return 200', async () => {
      const expectedSubject = `Purrfect Adoptions - Reactivation Request Received`
      const expectedMessage = `
    <p>Dear Shelter 1,</p>
    <p>We have received a request to reactivate the application with ID: <strong>${applicationID}</strong>.</p>
    <p>The applicant has provided reasons for their previous inability to proceed and expressed a desire to reactivate the application process.</p>
    <p>To review the details and take appropriate actions, please <a href="https://purrfect-adoptions.vercel.app/view/application/${applicationID}/">click here</a>.</p>
    <p>Thank you for your attention to this matter.</p>
    <p>Best Regards,</p>
    <p>The Purrfect Adoptions Team</p>
  `

      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toBe(
        'Reactivation Request submitted successfully'
      )
      // Check if the reactivation request has been added in db
      const reactivationRequest = await ReactivationRequest.findOne({
        applicationID: applicationID
      })

      expect(reactivationRequest).toBeDefined()
      expect(sendEmailSpy).toBeCalledTimes(1)

      // Check email to shelter
      expect(sendEmailSpy).toBeCalledWith(
        'shelter1@test.com',
        expectedSubject,
        expectedMessage
      )
    })

    it('should throw error if associated application does not exist', async () => {
      await removeAllApplications()
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toBe('Application not found')
    })

    it('should throw error if shelter of associated application does not exist', async () => {
      await removeAllShelters()
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toBe('Shelter not found')
    })

    it('should throw error if reactivation request for that application already exists', async () => {
      await generateReactivationRequest(applicationID)
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(409)

      expect(response.text).toBe('Reactivation Request already exists')
    })

    it('should throw Bad Request if application ID is less than 24 charcaters long', async () => {
      applicationID = '123456'
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toBe(
        '"applicationID" length must be 24 characters long'
      )
    })

    it('should throw Bad Request if application ID is greater than 24 charcaters long', async () => {
      applicationID = '1234567890123456789012345'
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toBe(
        '"applicationID" length must be 24 characters long'
      )
    })

    it('should throw Bad Request if reasonNotScheduled is empty', async () => {
      payload.reasonNotScheduled = ''
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toBe(
        '"reasonNotScheduled" is not allowed to be empty'
      )
    })

    it('should throw Bad Request if reasonNotScheduled is a number', async () => {
      const invalidPayload = {
        reasonNotScheduled: 12345
      }
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(invalidPayload)
        .expect(400)

      expect(response.text).toBe('"reasonNotScheduled" must be a string')
    })

    it('should throw Bad Request if reasonToReactivate is empty', async () => {
      payload.reasonToReactivate = ''
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toBe(
        '"reasonToReactivate" is not allowed to be empty'
      )
    })

    it('should throw Bad Request if reasonToReactivate is a number', async () => {
      const invalidPayload = {
        reasonNotScheduled:
          'I had an unexpected personal commitment that consumed my attention during that time, and I missed the scheduling window.',
        reasonToReactivate: 12345
      }
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(invalidPayload)
        .expect(400)

      expect(response.text).toBe('"reasonToReactivate" must be a string')
    })

    it('should throw Bad Request if reasonNotScheduled is missing', async () => {
      const invalidPayload = {
        reasonToReactivate:
          'The commitment has been addressed, and I am now fully available to proceed with the visit scheduling.'
      }
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(invalidPayload)
        .expect(400)

      expect(response.text).toBe('"reasonNotScheduled" is required')
    })

    it('should throw Bad Request if reasonToReactivate is missing', async () => {
      const invalidPayload = {
        reasonNotScheduled:
          'I had an unexpected personal commitment that consumed my attention during that time, and I missed the scheduling window.'
      }
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(invalidPayload)
        .expect(400)

      expect(response.text).toBe('"reasonToReactivate" is required')
    })

    it('should throw Unauthorized if token is missing', async () => {
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .send(payload)
        .expect(401)

      expect(response.text).toBe('Unauthorized')
    })

    it('should throw error if shelter tries to create reactivation request', async () => {
      const shelter = await generateAdminandTokens(Role.Shelter)
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(403)

      expect(response.text).toBe('Permission denied')
    })

    it('should throw error if admin tries to create reactivation request', async () => {
      const admin = await generateAdminandTokens(Role.Shelter)
      const response = await request(app)
        .post(`/reactivationRequest/${applicationID}`)
        .auth(admin.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(403)

      expect(response.text).toBe('Permission denied')
    })
  })

  describe('get reactivation request', () => {
    let user: User, applicationID

    beforeEach(async () => {
      user = await generateUserandTokens()
      applicationID = await generatePetWithApplication(user.email)
      await generateReactivationRequest(applicationID)
    })

    afterEach(async () => {
      await removeAllUsers()
      await removePets()
      await removeAllApplications()
      await removeAllReactivationRequests()
    })

    it('should successfully return details of the reactivation request', async () => {
      const response = await request(app)
        .get(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body).toBeDefined()
    })

    it('should throw error if reactivation request against that applicationID does not exist', async () => {
      await removeAllReactivationRequests()
      const response = await request(app)
        .get(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Reactivation Request not found')
    })

    it('should throw error if the corresponding applicationID does not exist', async () => {
      await removeAllApplications()
      const response = await request(app)
        .get(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Application not found')
    })

    it('should throw Bad Request if applicationID length is less than 24 chaaracters', async () => {
      applicationID = '12345'
      const response = await request(app)
        .get(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        '"applicationID" length must be 24 characters long'
      )
    })

    it('should throw Bad Request if applicationID length is greater than 24 chaaracters', async () => {
      applicationID = '1234567890123456789012345'
      const response = await request(app)
        .get(`/reactivationRequest/${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        '"applicationID" length must be 24 characters long'
      )
    })

    it('should throw Unauthorized if token is missing', async () => {
      const response = await request(app)
        .get(`/reactivationRequest/${applicationID}`)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })
  })
})

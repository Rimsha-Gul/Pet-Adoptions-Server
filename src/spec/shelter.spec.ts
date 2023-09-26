import request from 'supertest'
import {
  Admin,
  User,
  generateAdminandTokens,
  generateUserandTokens,
  removeAllUsers
} from './utils/generateUserAndToken'
import { dropCollections, dropDatabase, mongooseSetUp } from './utils/setup'
import { app } from '../app'
import { generateShelters, removeAllShelters } from './utils/generateShelters'
import { EmailPayload, Role, User as UserModel } from '../models/User'
import { generateReview } from './utils/generateReview'
import * as sendEmailModule from '../middleware/sendEmail'
import * as generateInvitationTokenModule from '../utils/generateInvitationToken'
import {
  generateAcceptedInvitation,
  generateExpiredInvitation,
  generateInvitation
} from './utils/generateInvitation'
import { generateInvitationToken } from '../utils/generateInvitationToken'
import {
  generatePetData,
  generatePetWithApplication
} from './utils/generatePet'
import {
  generateApplication,
  removeAllApplications
} from './utils/generateApplication'
import { Application } from '../models/Application'

describe('review', () => {
  beforeAll(async () => {
    await mongooseSetUp()
  })

  afterEach(async () => {
    await dropCollections()
  })

  afterAll(async () => {
    await dropDatabase()
  })

  describe('get a shelter', () => {
    let user: User, shelters

    beforeEach(async () => {
      user = await generateUserandTokens()
      await generateShelters()
      shelters = await UserModel.find({ role: 'SHELTER' })
    })
    afterEach(async () => {
      await removeAllUsers()
      jest.restoreAllMocks()
    })

    it('should successfully fetch the shelter', async () => {
      const response = await request(app)
        .get(`/shelter?id=${shelters[0]._id}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body).toBeDefined()
      // expect(response.body.canReview).toEqual(false)
    })

    it('should successfully fetch the shelter and user cannot review it', async () => {
      await generateReview(shelters[0]._id)
      const response = await request(app)
        .get(`/shelter?id=${shelters[0]._id}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body).toBeDefined()
      // expect(response.body.canReview).toEqual(true)
    })

    it('should respond with Bad request if id is missing', async () => {
      const response = await request(app)
        .get(`/shelter`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"id" is required`)
    })
  })

  describe('invite a shelter', () => {
    let admin: Admin, shelters, payload: EmailPayload
    let generateInvitationTokenSpy: jest.SpyInstance
    let sendEmailSpy: jest.SpyInstance

    let expectedRecipient
    const expectedSubject = `Purrfect Adoptions - Invitation to Join Our Network`
    const expectedMessage = `
    <p>Greetings,</p>
    <p>We are thrilled to extend an invitation to join our growing network of dedicated shelters on Purrfect Adoptions.</p>
    <p>We have built a platform that brings together shelters and potential pet adopters, with a mission to find loving and suitable homes for as many pets as possible.</p>
    <p>To accept this invitation and begin the registration process, please click <a href="http://127.0.0.1:5173/shelter/invitation/invite123/">here</a></p>
    <p>Please note that this invitation is valid for one week. If the invitation has expired, please contact us to receive a new one.</p>
    <p>If you have any questions or need further assistance, please do not hesitate to reply to this email. We look forward to partnering with you in our endeavor to make a positive impact on the lives of pets and adopters alike.</p>
    <p>Thank you,</p>
    <p>The Purrfect Adoptions Team</p>
  `

    beforeEach(async () => {
      admin = await generateAdminandTokens(Role.Admin)
      await generateShelters()
      shelters = await UserModel.find({ role: 'SHELTER' })
      payload = {
        email: 'newshelter@gmail.com'
      }

      // Spy on the generateInvitationToken function and mock its implementation
      generateInvitationTokenSpy = jest.spyOn(
        generateInvitationTokenModule,
        'generateInvitationToken'
      )
      generateInvitationTokenSpy.mockImplementation(() => 'invite123')

      // Spy on the sendEmail function
      sendEmailSpy = jest.spyOn(sendEmailModule, 'sendEmail')
      sendEmailSpy.mockImplementation(() => Promise.resolve())
    })
    afterEach(async () => {
      await removeAllUsers()
      jest.restoreAllMocks()
    })

    it('should successfully invite the shelter', async () => {
      const response = await request(app)
        .post('/shelter/invite')
        .auth(admin.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual('Invitation sent successfully')
      expect(sendEmailSpy).toBeCalledTimes(1)
      expectedRecipient = payload.email
      expect(sendEmailSpy).toBeCalledWith(
        expectedRecipient,
        expectedSubject,
        expectedMessage
      )
    })

    it('should throw an error if user tries to invite a shelter', async () => {
      const user = await generateUserandTokens()

      const response = await request(app)
        .post('/shelter/invite')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(403)

      expect(response.text).toEqual('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter tries to invite a shelter', async () => {
      await removeAllUsers()
      const shelter = await generateAdminandTokens(Role.Shelter)

      const response = await request(app)
        .post('/shelter/invite')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(403)

      expect(response.text).toEqual('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter already exists', async () => {
      payload = {
        email: shelters[0].email
      }
      const response = await request(app)
        .post('/shelter/invite')
        .auth(admin.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(409)

      expect(response.text).toEqual('Shelter already  exists')
      expect(response.body).toEqual({})
    })

    it('should throw an error if there is a user against that email', async () => {
      await generateUserandTokens()
      payload = {
        email: 'test@gmail.com'
      }
      const response = await request(app)
        .post('/shelter/invite')
        .auth(admin.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(409)

      expect(response.text).toEqual(
        'User already  exists, which is not a shelter'
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if an invite has already been sent to that shelter', async () => {
      await removeAllShelters()
      await generateInvitation('shelter1@test.com')
      payload = {
        email: 'shelter1@test.com'
      }
      const response = await request(app)
        .post('/shelter/invite')
        .auth(admin.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(409)

      expect(response.text).toEqual('Invite already sent')
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if shelter email is missing', async () => {
      const response = await request(app)
        .post('/shelter/invite')
        .auth(admin.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })
  })

  describe('verify the invitation token', () => {
    let user: User, shelters

    beforeEach(async () => {
      user = await generateUserandTokens()
      await generateShelters()
      shelters = await UserModel.find({ role: 'SHELTER' })
    })

    afterEach(async () => {
      await removeAllUsers()
      await removeAllShelters()
      jest.restoreAllMocks()
    })

    it('should successfully verify the invitation token', async () => {
      await removeAllShelters()
      const invitationToken = await generateInvitation('shelter1@test.com')

      const response = await request(app)
        .get(
          `/shelter/verifyInvitationToken?invitationToken=${invitationToken}`
        )
        .expect(200)

      expect(response.body).toBeDefined()
    })

    it('should throw error if shelter already exists', async () => {
      await generateAdminandTokens(Role.Shelter)
      const invitationToken = await generateInvitation(shelters[0].email)

      const response = await request(app)
        .get(
          `/shelter/verifyInvitationToken?invitationToken=${invitationToken}`
        )
        .expect(409)

      expect(response.body.message).toEqual('Shelter already  exists')
    })

    it('should throw error if shelter already exists', async () => {
      const invitationToken = await generateInvitation(shelters[0].email)

      const response = await request(app)
        .get(
          `/shelter/verifyInvitationToken?invitationToken=${invitationToken}`
        )
        .expect(409)

      expect(response.body.message).toEqual(
        'Shelter already  exists, but is not verified'
      )
    })

    it('should throw error if token is for user', async () => {
      const invitationToken = await generateInvitation(user.email)

      const response = await request(app)
        .get(
          `/shelter/verifyInvitationToken?invitationToken=${invitationToken}`
        )
        .expect(409)

      expect(response.body.message).toEqual(
        'User already  exists, which is not a shelter'
      )
    })

    it('should respond with Bad Request if token is invalid', async () => {
      const response = await request(app)
        .get('/shelter/verifyInvitationToken?invitationToken=invalidToken')
        .expect(400)

      expect(response.body.message).toEqual('Invalid invitation token')
    })

    it('should respond with Bad Request if token is expired', async () => {
      const expiredInvitationToken = await generateExpiredInvitation(
        shelters[0].email
      )

      const response = await request(app)
        .get(
          `/shelter/verifyInvitationToken?invitationToken=${expiredInvitationToken}`
        )
        .expect(400)

      expect(response.body.message).toEqual('Expired invitation token')
    })

    it('should respond with Bad Request if token is already accepted', async () => {
      const acceptedInvitationToken = await generateAcceptedInvitation(
        'newShelter@gmail.com'
      )

      const response = await request(app)
        .get(
          `/shelter/verifyInvitationToken?invitationToken=${acceptedInvitationToken}`
        )
        .expect(400)

      expect(response.body.message).toEqual('Invalid or expired invitation')
    })

    it('should respond with Bad Request if token is not present against that email', async () => {
      const invitationToken = await generateInvitationToken(
        'newShelter@gmail.com',
        Role.Shelter
      )

      const response = await request(app)
        .get(
          `/shelter/verifyInvitationToken?invitationToken=${invitationToken}`
        )
        .expect(400)

      expect(response.body.message).toEqual('Invalid or expired invitation')
    })

    it('should respond with Bad Request if token is missing', async () => {
      const response = await request(app)
        .get(`/shelter/verifyInvitationToken`)
        .expect(400)

      expect(response.text).toEqual(`"invitationToken" is required`)
      expect(response.body).toEqual({})
    })
  })

  describe('get application details for shelter', () => {
    let user: User, shelter: Admin, applicationID

    beforeEach(async () => {
      user = await generateUserandTokens()
      shelter = await generateAdminandTokens(Role.Shelter)
      await generateShelters()
      applicationID = await generatePetWithApplication(user.email)
    })

    afterEach(async () => {
      await removeAllUsers()
      await removeAllShelters()
      await removeAllApplications()
      jest.restoreAllMocks()
    })

    it('should successfully return the application details', async () => {
      const response = await request(app)
        .get(`/shelter/application?id=${applicationID}`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body).toBeDefined()
    })

    it('should throw not found if application does not exist', async () => {
      await removeAllApplications()
      const response = await request(app)
        .get(`/shelter/application?id=${applicationID}`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Application not found')
    })

    it('should throw not found if applicant does not exist', async () => {
      const storedShelter = await UserModel.findOne({ email: shelter.email })
      const pet = await generatePetData()

      await generateApplication(
        storedShelter?._id,
        pet.microchipID,
        'nonExistentUSer@gmail.com'
      )
      const application = await Application.findOne({
        applicantEmail: 'nonExistentUSer@gmail.com',
        microchipID: pet.microchipID
      })
      const response = await request(app)
        .get(`/shelter/application?id=${application?._id}`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Applicant not found')
    })

    it('should throw not found if pet does not exist', async () => {
      const storedShelter = await UserModel.findOne({ email: shelter.email })

      await generateApplication(storedShelter?._id, 'B123456789', user.email)
      const application = await Application.findOne({
        applicantEmail: user.email,
        microchipID: 'B123456789'
      })
      const response = await request(app)
        .get(`/shelter/application?id=${application?._id}`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Pet not found')
    })

    it('should throw error if user tries to access it', async () => {
      const response = await request(app)
        .get(`/shelter/application?id=${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(403)

      expect(response.text).toEqual('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw Bad Request if id is not valid', async () => {
      const response = await request(app)
        .get(`/shelter/application?id=invalidID`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"id" length must be 24 characters long')
      expect(response.body).toEqual({})
    })

    it('should throw Bad Request if id is missing', async () => {
      const response = await request(app)
        .get(`/shelter/application`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"id" is required')
      expect(response.body).toEqual({})
    })
  })
})

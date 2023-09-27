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
import {
  generatePet,
  generatePetWithApplication,
  removePets,
  removeAllPets
} from './utils/generatePet'
import { Role, User as UserModel } from '../models/User'
import { Pet as PetModel } from '../models/Pet'
import {
  generateApplications,
  generateApplication,
  generateApplicationData,
  removeAllApplications
} from './utils/generateApplication'
import { VisitType } from '../models/Visit'
import {
  generateAllVisitsForDate,
  removeAllVisits
} from './utils/generateVisit'
import { removeAllShelters } from './utils/generateShelters'
import {
  Application,
  Application as ApplicationModel,
  ResidenceType,
  ScheduleHomeVisitPayload,
  Status,
  UpdateApplicationPayload
} from '../models/Application'
import moment from 'moment'
import * as sendEmailModule from '../middleware/sendEmail'
import { Pet } from '../models/Pet'
import {
  dateDifferenceInDays,
  dateDifferenceInSeconds
} from './utils/getTimeDifference'
import * as socketModule from '../socket'

describe('application', () => {
  beforeAll(async () => {
    await mongooseSetUp()
  })

  afterEach(async () => {
    await dropCollections()
  })

  afterAll(async () => {
    await dropDatabase()
  })

  describe('create application', () => {
    let user: User, application, pet, shelter

    beforeEach(async () => {
      user = await generateUserandTokens()
      await generatePet()
      await generateAdminandTokens(Role.Shelter)
      pet = await PetModel.findOne({ microchipID: 'A123456789' })
      shelter = await UserModel.findOne({ email: 'shelter1@test.com' })
      application = generateApplicationData(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        shelter!._id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pet!.microchipID
      )
    })

    afterEach(async () => {
      await removeAllUsers()
      await removeAllPets()
      await removeAllApplications()
    })

    it('should successfully create an application for the pet by the user', async () => {
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(200)

      expect(response.body).toBeDefined()
      const createdApplication = await ApplicationModel.findOne({
        applicantEmail: user.email,
        shelterID: shelter._id,
        microchipID: pet.microchipID
      })
      expect(createdApplication).toBeDefined()
    })

    it('should successfully create an application for the pet by the user', async () => {
      application.residenceType = ResidenceType.Rent
      application.hasRentPetPermission = true
      application.hasChildren = true
      application.childrenAges = '2,4'
      application.hasOtherPets = true
      application.otherPetsInfo = 'Cat 1'

      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(200)

      expect(response.body).toBeDefined()
      const createdApplication = await ApplicationModel.findOne({
        applicantEmail: user.email,
        shelterID: shelter._id,
        microchipID: pet.microchipID
      })
      expect(createdApplication).toBeDefined()
    })

    it('should throw error if pet is not found', async () => {
      await PetModel.deleteOne({ microchipID: 'A123456789' })

      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(404)

      expect(response.text).toBe('Pet not found')
    })

    it('should throw error if shelter is not found', async () => {
      await UserModel.deleteOne({ email: 'shelter1@test.com' })

      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(404)

      expect(response.text).toBe('Shelter not found')
    })

    it('should throw error if user has already applied for the same pet', async () => {
      // Make an application
      await generateApplication(shelter._id, pet.microchipID, user.email)

      // Try to make the same application again
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('You have already applied for this pet.')
    })

    it('should throw error if shelter tries to apply for a pet', async () => {
      const response = await request(app)
        .post('/application/')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(403)

      expect(response.text).toBe('Permission denied')
    })

    it('should throw Unauthorized error if token is not provided', async () => {
      const response = await request(app)
        .post('/application/')
        .send(application)
        .expect(401)

      expect(response.text).toBe('Unauthorized')
    })

    it('should respond with Bad Request if shelterID is missing', async () => {
      application.shelterID = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"shelterID" is required')
    })

    it('should respond with Bad Request if microchipID is missing', async () => {
      application.microchipID = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"microchipID" is required')
    })

    it('should respond with Bad Request if residenceType is missing', async () => {
      application.residenceType = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"residenceType" is required')
    })

    it('should respond with Bad Request if hasChildren is missing', async () => {
      application.hasChildren = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"hasChildren" is required')
    })

    it('should respond with Bad Request if hasOtherPets is missing', async () => {
      application.hasOtherPets = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"hasOtherPets" is required')
    })

    it('should respond with Bad Request if petAloneTime is missing', async () => {
      application.petAloneTime = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petAloneTime" is required')
    })

    it('should respond with Bad Request if hasPlayTimeParks is missing', async () => {
      application.hasPlayTimeParks = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"hasPlayTimeParks" is required')
    })

    it('should respond with Bad Request if petActivities is missing', async () => {
      application.petActivities = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petActivities" is required')
    })

    it('should respond with Bad Request if handlePetIssues is missing', async () => {
      application.handlePetIssues = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"handlePetIssues" is required')
    })

    it('should respond with Bad Request if moveWithPet is missing', async () => {
      application.moveWithPet = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"moveWithPet" is required')
    })

    it('should respond with Bad Request if canAffordPetsNeeds is missing', async () => {
      application.canAffordPetsNeeds = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"canAffordPetsNeeds" is required')
    })

    it('should respond with Bad Request if canAffordPetsMediacal is missing', async () => {
      application.canAffordPetsMediacal = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"canAffordPetsMediacal" is required')
    })

    it('should respond with Bad Request if petTravelPlans is missing', async () => {
      application.petTravelPlans = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petTravelPlans" is required')
    })

    it('should respond with Bad Request if petOutlivePlans is missing', async () => {
      application.petOutlivePlans = undefined
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petOutlivePlans" is required')
    })

    it('should respond with Bad Request if residenceType is rent and hasRentPetPermission is missing', async () => {
      application.residenceType = ResidenceType.Rent
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"hasRentPetPermission" is required')
    })

    it('should respond with Bad Request if hasChildren is true and childrenAges is missing', async () => {
      application.hasChildren = true
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"childrenAges" is required')
    })

    it('should respond with Bad Request if hasOtherPets is true and otherPetsInfo is missing', async () => {
      application.hasOtherPets = true
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"otherPetsInfo" is required')
    })

    it('should respond with Bad Request if microchipID is empty', async () => {
      application.microchipID = ''
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"microchipID" is not allowed to be empty')
    })

    it('should respond with Bad Request if petActivities is empty', async () => {
      application.petActivities = ''
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petActivities" is not allowed to be empty')
    })

    it('should respond with Bad Request if handlePetIssues is empty', async () => {
      application.handlePetIssues = ''
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"handlePetIssues" is not allowed to be empty')
    })

    it('should respond with Bad Request if moveWithPet is empty', async () => {
      application.moveWithPet = ''
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"moveWithPet" is not allowed to be empty')
    })

    it('should respond with Bad Request if petTravelPlans is empty', async () => {
      application.petTravelPlans = ''
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petTravelPlans" is not allowed to be empty')
    })

    it('should respond with Bad Request if petOutlivePlans is empty', async () => {
      application.petOutlivePlans = ''
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petOutlivePlans" is not allowed to be empty')
    })

    it('should respond with Bad Request if hasChildren is true and childrenAges is empty', async () => {
      application.hasChildren = true
      application.childrenAges = ''
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"childrenAges" is not allowed to be empty')
    })

    it('should respond with Bad Request if hasOtherPets is true and otherPetsInfo is empty', async () => {
      application.hasOtherPets = true
      application.otherPetsInfo = ''
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"otherPetsInfo" is not allowed to be empty')
    })

    it('should respond with Bad Request if shelterID is less than 24 characters', async () => {
      application.shelterID = '12345'
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe(
        '"shelterID" length must be 24 characters long'
      )
    })

    it('should respond with Bad Request if shelterID is greater than 24 characters long', async () => {
      application.shelterID = '1234567890123456789012345'
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe(
        '"shelterID" length must be 24 characters long'
      )
    })

    it('should respond with Bad Request if shelterID is a number', async () => {
      application.shelterID = 12345
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"shelterID" must be a string')
    })

    it('should respond with Bad Request if microchipID is less than 10 characters long', async () => {
      application.microchipID = '12345'
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe(
        '"microchipID" length must be 10 characters long'
      )
    })

    it('should respond with Bad Request if microchipID is greater than 10 characters long', async () => {
      application.microchipID = 'A1234567890'
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe(
        '"microchipID" length must be 10 characters long'
      )
    })

    it('should respond with Bad Request if microchipID is a number', async () => {
      application.microchipID = 1234567890
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"microchipID" must be a string')
    })

    it('should respond with Bad Request if residenceType is invalid', async () => {
      application.residenceType = 'PrivateIsland'
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe(
        '"residenceType" must be one of [ownHouse, rentHouse]'
      )
    })

    it('should respond with Bad Request if hasChildren is a number', async () => {
      application.hasChildren = 2
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"hasChildren" must be a boolean')
    })

    it('should respond with Bad Request if hasOtherPets is a number', async () => {
      application.hasOtherPets = 2
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"hasOtherPets" must be a boolean')
    })

    it('should respond with Bad Request if petAloneTime is a string', async () => {
      application.petAloneTime = 'abc'
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petAloneTime" must be a number')
    })

    it('should respond with Bad Request if petAloneTime is a negative number', async () => {
      application.petAloneTime = -1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe(
        '"petAloneTime" must be greater than or equal to 0'
      )
    })

    it('should respond with Bad Request if petAloneTime is greater than 24', async () => {
      application.petAloneTime = 25
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe(
        '"petAloneTime" must be less than or equal to 24'
      )
    })

    it('should respond with Bad Request if hasPlayTimeParks is a number', async () => {
      application.hasPlayTimeParks = 1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"hasPlayTimeParks" must be a boolean')
    })

    it('should respond with Bad Request if petActivities is a number', async () => {
      application.petActivities = 1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petActivities" must be a string')
    })

    it('should respond with Bad Request if handlePetIssues is a number', async () => {
      application.handlePetIssues = 1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"handlePetIssues" must be a string')
    })

    it('should respond with Bad Request if moveWithPet is a number', async () => {
      application.moveWithPet = 1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"moveWithPet" must be a string')
    })

    it('should respond with Bad Request if canAffordPetsNeeds is a number', async () => {
      application.canAffordPetsNeeds = 1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"canAffordPetsNeeds" must be a boolean')
    })

    it('should respond with Bad Request if canAffordPetsMediacal is a number', async () => {
      application.canAffordPetsMediacal = 1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"canAffordPetsMediacal" must be a boolean')
    })

    it('should respond with Bad Request if petTravelPlans is a number', async () => {
      application.petTravelPlans = 1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petTravelPlans" must be a string')
    })

    it('should respond with Bad Request if petOutlivePlans is a number', async () => {
      application.petOutlivePlans = 1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"petOutlivePlans" must be a string')
    })

    it('should respond with Bad Request if residenceType is rent and hasRentPetPermission is a number', async () => {
      application.residenceType = ResidenceType.Rent
      application.hasRentPetPermission = 1
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"hasRentPetPermission" must be a boolean')
    })

    it('should respond with Bad Request if residenceType is own and hasRentPetPermission is present', async () => {
      application.residenceType = ResidenceType.Own
      application.hasRentPetPermission = true
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"hasRentPetPermission" is not allowed')
    })

    it('should respond with Bad Request if hasChildren is false and childrenAges is a number', async () => {
      application.hasChildren = true
      application.childrenAges = 12
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"childrenAges" must be a string')
    })

    it('should respond with Bad Request if hasChildren is false and childrenAges is present', async () => {
      application.hasChildren = false
      application.childrenAges = '2,4'
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"childrenAges" is not allowed')
    })

    it('should respond with Bad Request if hasOtherPets is true and otherPetsInfo is a number', async () => {
      application.hasOtherPets = true
      application.otherPetsInfo = 12
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"otherPetsInfo" must be a string')
    })

    it('should respond with Bad Request if hasOtherPets is false and otherPetsInfo is present', async () => {
      application.hasOtherPets = false
      application.otherPetsInfo = 'Cat 1'
      const response = await request(app)
        .post('/application/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(application)
        .expect(400)

      expect(response.text).toBe('"otherPetsInfo" is not allowed')
    })
  })

  describe('get application details for user', () => {
    let user: User, shelter: Admin, applicationID

    beforeEach(async () => {
      user = await generateUserandTokens()
      shelter = await generateAdminandTokens(Role.Shelter)
      applicationID = await generatePetWithApplication(user.email)
    })

    afterEach(async () => {
      await removeAllUsers()
      await removeAllApplications()
      jest.restoreAllMocks()
    })

    it('should successfully return the application details', async () => {
      const response = await request(app)
        .get(`/application?id=${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body).toBeDefined()
    })

    it('should throw not found if application does not exist', async () => {
      await removeAllApplications()
      const response = await request(app)
        .get(`/application?id=${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Application not found')
    })

    it('should throw not found if pet does not exist', async () => {
      await removePets()

      const response = await request(app)
        .get(`/application?id=${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Pet not found')
    })

    it('should throw not found if shelter does not exist', async () => {
      await removeAllShelters()

      const response = await request(app)
        .get(`/application?id=${applicationID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Shelter not found')
    })

    it('should throw error if shelter tries to access it', async () => {
      const response = await request(app)
        .get(`/application?id=${applicationID}`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .expect(403)

      expect(response.text).toEqual('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw Bad Request if id is not valid', async () => {
      const response = await request(app)
        .get(`/application?id=invalidID`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"id" length must be 24 characters long')
      expect(response.body).toEqual({})
    })

    it('should throw Bad Request if id is missing', async () => {
      const response = await request(app)
        .get(`/application`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"id" is required')
      expect(response.body).toEqual({})
    })
  })

  describe('get applications', () => {
    let user: User, shelter: Admin

    beforeEach(async () => {
      user = await generateUserandTokens()

      await generateApplications()
      shelter = await generateAdminandTokens(Role.Shelter)
    })

    afterEach(async () => {
      await removeAllUsers()
      await removeAllApplications()
      await removeAllPets()
      jest.restoreAllMocks()
    })

    it('should fetch the first page of applications and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications).toBeInstanceOf(Array)
      expect(response.body.applications).toHaveLength(5)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should fetch the second page of applications and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?page=2`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications).toBeInstanceOf(Array)
      expect(response.body.applications).toHaveLength(4)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should fetch the first 4 applications and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?limit=4`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications).toBeInstanceOf(Array)
      expect(response.body.applications).toHaveLength(4)
      expect(response.body.totalPages).toEqual(3)
    })

    it('should fetch the 2 applications from page 2 and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?page=2&limit=6`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications).toBeInstanceOf(Array)
      expect(response.body.applications).toHaveLength(3)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should handle non-existing pages', async () => {
      const response = await request(app)
        .get(`/application/applications?page=3`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications).toBeInstanceOf(Array)
      expect(response.body.applications).toHaveLength(0)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should return an error when token is missing', async () => {
      const response = await request(app)
        .get(`/application/applications?page=1`)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })

    it('should respond with Bad Request if limit value is invalid', async () => {
      const response = await request(app)
        .get(`/application/applications?limit=-1`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        '"limit" must be greater than or equal to 1'
      )
    })

    it('should respond with Bad Request if page number is invalid', async () => {
      const response = await request(app)
        .get(`/application/applications?page=-1`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"page" must be greater than or equal to 1')
    })

    it('should respond with Bad Request if limit value is 0', async () => {
      const response = await request(app)
        .get(`/application/applications?limit=0`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        '"limit" must be greater than or equal to 1'
      )
    })

    it('should respond with Bad Request if page number is 0', async () => {
      const response = await request(app)
        .get(`/application/applications?page=0`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"page" must be greater than or equal to 1')
    })

    it('should respond with Bad Request if limit is a string', async () => {
      const response = await request(app)
        .get(`/application/applications?limit=-limit`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"limit" must be a number')
    })

    it('should respond with Bad Request if page is a string', async () => {
      const response = await request(app)
        .get(`/application/applications?page=-page`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"page" must be a number')
    })

    it('should filter applications whose status is Under Review and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?applicationStatusFilter=Under Review`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose status is Home Visit Requested and return 200', async () => {
      const response = await request(app)
        .get(
          `/application/applications?applicationStatusFilter=Home Visit Requested`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose status is Home Visit Scheduled and return 200', async () => {
      const response = await request(app)
        .get(
          `/application/applications?applicationStatusFilter=Home Visit Scheduled`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose status is Home Approved and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?applicationStatusFilter=Home Approved`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose status is Home Rejected and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?applicationStatusFilter=Home Rejected`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose status is User Visit Scheduled and return 200', async () => {
      const response = await request(app)
        .get(
          `/application/applications?applicationStatusFilter=User Visit Scheduled`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose status is Approved and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?applicationStatusFilter=Approved`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose status is Rejected and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?applicationStatusFilter=Rejected`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose status is Closed and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?applicationStatusFilter=Closed`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose pets name has snow in it and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?searchQuery=snow`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(2)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should handle case when pets name does not match any pets in applications', async () => {
      const response = await request(app)
        .get(`/application/applications?searchQuery=maxfield`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter applications whose shelter name has 1(Shelter 1) in it and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?searchQuery=1`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose shelter name has 2(Shelter 2) in it and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?searchQuery=2`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(5) // total 8 applications, limit is 5
      expect(response.body.totalPages).toEqual(2)
    })

    it('should filter applications whose pet name has max in it and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?searchQuery=max`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose applicant name has test(test@gmail.com) in it and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?searchQuery=test`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })
  })

  describe('get time slots', () => {
    let user: User, shelter, applicationID, pet

    beforeEach(async () => {
      user = await generateUserandTokens()
      await generateAdminandTokens(Role.Shelter)
      shelter = await UserModel.findOne({ email: 'shelter1@test.com' })
      await generatePet()
      applicationID = await generatePetWithApplication(user.email)
      pet = await PetModel.findOne({ microchipID: 'A123456789' })
    })

    afterEach(async () => {
      await removeAllUsers()
      await removeAllApplications()
      await removeAllPets()
      await removeAllVisits()
    })

    it('should fetch the available time slots on a specific date for home visit and return 200', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.availableTimeSlots).toBeInstanceOf(Array)
      expect(response.body.availableTimeSlots).toHaveLength(9)
    })

    it('should fetch the available time slots on a specific date for shelter visit and return 200', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}&visitType=Shelter`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.availableTimeSlots).toBeInstanceOf(Array)
      expect(response.body.availableTimeSlots).toHaveLength(9)
    })

    it('should fetch the available time slots on a specific date for home visit and return 200', async () => {
      // Generate a date string for one day ahead of the current date
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      await generateApplication(
        shelter._id,
        pet.microchipID,
        user.email,
        visitDate + 'T04:00:00Z',
        VisitType.Home
      )
      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.availableTimeSlots).toBeInstanceOf(Array)
      expect(response.body.availableTimeSlots).toHaveLength(8)
    })

    it('should fetch the available time slots on a specific date for shelter visit and return 200', async () => {
      // Generate a date string for one day ahead of the current date
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      await generateApplication(
        shelter._id,
        pet.microchipID,
        user.email,
        visitDate + 'T04:00:00Z',
        VisitType.Shelter
      )
      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}&visitType=Shelter`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.availableTimeSlots).toBeInstanceOf(Array)
      expect(response.body.availableTimeSlots).toHaveLength(8)
    })

    it('should fetch zero available time slots on a specific date for home visit and return 200', async () => {
      // Generate a date string for one day ahead of the current date
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      await generateAllVisitsForDate(
        applicationID,
        shelter._id,
        pet.microchipID,
        user.email,
        visitDate,
        VisitType.Home
      )

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.availableTimeSlots).toBeInstanceOf(Array)
      expect(response.body.availableTimeSlots).toHaveLength(0)
    })

    it('should fetch zero available time slots on a specific date for shelter visit and return 200', async () => {
      // Generate a date string for one day ahead of the current date
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      await generateAllVisitsForDate(
        applicationID,
        shelter._id,
        pet.microchipID,
        user.email,
        visitDate,
        VisitType.Shelter
      )

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}&visitType=Shelter`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.availableTimeSlots).toBeInstanceOf(Array)
      expect(response.body.availableTimeSlots).toHaveLength(0)
    })

    it('should throw Bad Request if shelterID is less than 24 characters long', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=12345&petID=A123456789&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"id" length must be 24 characters long')
    })

    it('should throw Bad Request if shelterID is greater than 24 characters long', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=1234567890123456789012345&petID=A123456789&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"id" length must be 24 characters long')
    })

    it('should throw Bad Request if petID is less than 10 characters long', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A12345&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"petID" length must be 10 characters long')
    })

    it('should throw Bad Request if petID is greater than 10 characters long', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A1234567890&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"petID" length must be 10 characters long')
    })

    it('should return an error for a visitDate in the past', async () => {
      const pastDateObj = new Date()
      pastDateObj.setDate(pastDateObj.getDate() - 1) // Move the date 1 day to the past
      const pastDate = pastDateObj.toISOString().split('T')[0] // Format it in 'YYYY-MM-DD'

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A1234567890&visitDate=${pastDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      const receivedDateMatch = response.text.match(
        /"visitDate" must be greater than "(.*?)T/
      )
      if (!receivedDateMatch) {
        throw new Error('Could not extract date from response')
      }

      const receivedDate = receivedDateMatch[1]

      // Calculate the difference in days between the received date and the current date
      const differenceInDays = moment(receivedDate).diff(
        moment().utc().format('YYYY-MM-DD'),
        'days'
      )

      expect(differenceInDays).toBe(0) // Expect exactly zero-day difference
    })

    it('should return an error for a visitDate more than a week from now', async () => {
      const farFutureDate = moment().add(8, 'days').format('YYYY-MM-DD')

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A1234567890&visitDate=${farFutureDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      // Extract the date from the response text.
      const receivedDateMatch = response.text.match(
        /"visitDate" must be less than "(.*?)T/
      )
      if (!receivedDateMatch) {
        throw new Error('Could not extract date from response')
      }

      const receivedDate = receivedDateMatch[1]

      // Calculate the difference in days between the received date and the current time.
      const differenceInDays = moment(receivedDate).diff(
        moment().utc().format('YYYY-MM-DD'),
        'days'
      )

      expect(differenceInDays).toBe(7) // The date should be 7 days (1 week) from the current date
    })

    it('should throw Bad Request if visitType is invalid', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}&visitType=Park`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        '"visitType" must be one of [Home, Shelter]'
      )
    })

    it('should throw Bad Request if shelterId is empty', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=&petID=A123456789&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"id" is not allowed to be empty')
    })

    it('should throw Bad Request if petID is empty', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"petID" is not allowed to be empty')
    })

    it('should throw Bad Request if visitDate is empty', async () => {
      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"visitDate" must be a valid date')
    })

    it('should throw Bad Request if visitType is empty', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}&visitType=`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        '"visitType" must be one of [Home, Shelter]'
      )
    })

    it('should throw Bad Request if shelterId is missing', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?&petID=A123456789&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"id" is required')
    })

    it('should throw Bad Request if petID is empty', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&&visitDate=${visitDate}&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"petID" is required')
    })

    it('should throw Bad Request if visitDate is missing', async () => {
      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&&visitType=Home`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"visitDate" is required')
    })

    it('should throw Bad Request if visitType is missing', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}`
        )
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"visitType" is required')
    })

    it('should throw Unauthorized if token is missing', async () => {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const visitDate = currentDate.toISOString().split('T')[0]

      const response = await request(app)
        .get(
          `/application/timeSlots?id=${shelter._id}&petID=A123456789&visitDate=${visitDate}&visitType=Home`
        )
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })
  })

  describe('schedule home visit', () => {
    let user: User,
      shelter: Admin,
      applicationID,
      payload: ScheduleHomeVisitPayload
    const dateStr = moment().add(1, 'days').format('YYYY-MM-DD') // Adding one day for demonstration
    const timeStr = moment().format('HH:mm')
    const dateTimeStr = `${dateStr}T${timeStr}`
    const dateTimeInUTC = moment(dateTimeStr).utc().format()
    const formattedDateTime = new Date(dateTimeInUTC).toLocaleString()

    let sendEmailSpy: jest.SpyInstance

    beforeEach(async () => {
      user = await generateUserandTokens()
      applicationID = await generatePetWithApplication(user.email)
      shelter = await generateAdminandTokens(Role.Shelter)
      payload = {
        id: applicationID,
        visitDate: dateTimeInUTC
      }

      // Spy on the sendEmail function
      sendEmailSpy = jest.spyOn(sendEmailModule, 'sendEmail')
      sendEmailSpy.mockImplementation(() => Promise.resolve())
    })

    afterEach(async () => {
      await removeAllUsers()
      await removeAllApplications()
      await removeAllPets()
      jest.restoreAllMocks()
    })

    it('should successfully schedule a home visit', async () => {
      const expectedApplicantSubject = `Purrfect Adoptions - Home Visit Scheduled`
      const expectedApplicantMessage = `
    <p>We are happy to inform you that your home visit for your application, ID: <strong>${applicationID}</strong>, has been successfully scheduled.</p>
    <p>The visit is set for: <strong>${formattedDateTime}</strong></p>
    <p>Please ensure that you are available at the scheduled time. During the visit, we will assess the living conditions and ensure it is a safe and loving environment for our pets.</p>
    <p>If the visit is successful, we will then move on to the next step of the adoption process.</p>
    <p>Thank you for choosing Purrfect Adoptions!</p>
  `

      const expectedShelterSubject = `Purrfect Adoptions - Home Visit Scheduled`
      const expectedShelterMessage = `
    <p>A home visit for application ID: <strong>${applicationID}</strong> has been scheduled.</p>
    <p>The visit is set for: <strong>${formattedDateTime}</strong></p>
    <p>Please ensure that a representative is available to conduct the visit. During the visit, please assess the living conditions to ensure they are appropriate for the specific pet applied for. </p>
    <p>Ensure to document any significant findings for review in the application process.</p>
    <p>Thank you for your hard work!</p>
  `
      const response = await request(app)
        .post('/application/scheduleHomeVisit') // adjust the route to your actual API endpoint
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual('Home Visit has been scheduled')
      const updatedApplication = await Application.findById(applicationID)
      expect(updatedApplication?.status).toEqual(Status.HomeVisitScheduled)

      expect(sendEmailSpy).toBeCalledTimes(2)

      // Check email to applicant
      expect(sendEmailSpy).toBeCalledWith(
        user.email,
        expectedApplicantSubject,
        expectedApplicantMessage
      )

      // Check email to shelter
      expect(sendEmailSpy).toBeCalledWith(
        shelter.email,
        expectedShelterSubject,
        expectedShelterMessage
      )
    })

    it('should return an error if the application is not found', async () => {
      await removeAllApplications()

      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('Application not found')
      expect(response.body).toEqual({})
    })

    it('should return an error if the associated shelter is not found', async () => {
      await removeAllShelters()

      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('Shelter not found')
      expect(response.body).toEqual({})
    })

    it('should return Bad Request if id is missing', async () => {
      const incompletePayload = {
        visitDate: dateTimeInUTC
      }

      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual('"id" is required')
    })

    it('should return Bad Request if visitDate is missing', async () => {
      const incompletePayload = {
        id: applicationID
      }

      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual('"visitDate" is required')
    })

    it('should return Bad Request if application id length is less than 24', async () => {
      payload.id = '123456'

      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toEqual('"id" length must be 24 characters long')
    })

    it('should return Bad Request if application id length is greater than 24', async () => {
      payload.id = '1234567890123456789012345'

      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toEqual('"id" length must be 24 characters long')
    })

    it('should return Bad Request if application id is a number', async () => {
      const invalidPayload = { id: 12345 }

      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(invalidPayload)
        .expect(400)

      expect(response.text).toEqual('"id" must be a string')
    })

    it('should return an error for a visitDate in the past', async () => {
      const pastDate = moment().subtract(1, 'days').utc().format()
      payload.visitDate = pastDate

      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      // const currentDateUTC = moment().utc().format('YYYY-MM-DDTHH:mm:ss')

      const receivedDateMatch = response.text.match(
        /"visitDate" must be greater than "(.*?)\.\d{3}Z"/
      )
      if (!receivedDateMatch) {
        throw new Error('Could not extract date from response')
      }

      const receivedDate = receivedDateMatch[1]

      // Calculate the difference in seconds between the received date and the current time
      const differenceInSeconds = moment(receivedDate).diff(
        moment().utc().format('YYYY-MM-DDTHH:mm:ss'),
        'seconds'
      )

      expect(Math.abs(differenceInSeconds)).toBeLessThanOrEqual(119) // Accept up to 119 seconds difference
    })

    it('should return an error for a visitDate more than a week from now', async () => {
      const farFutureDate = moment()
        .add(8, 'days')
        .startOf('day')
        .utc()
        .format()
      payload.visitDate = farFutureDate

      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      // Extract the date from the response text.
      const receivedDateMatch = response.text.match(
        /"visitDate" must be less than "(.*?)\.\d{3}Z"/
      )
      if (!receivedDateMatch) {
        throw new Error('Could not extract date from response')
      }

      const receivedDate = receivedDateMatch[1]

      // Calculate the difference in days between the received date and the current time.
      const differenceInDays = moment(receivedDate).diff(
        moment().utc().startOf('day'),
        'days'
      )

      expect(differenceInDays).toBe(7) // The date should be 7 days (1 week) from the current date
    })

    it('should throw Unauthorized if token is missing', async () => {
      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .send(payload)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })

    it('should throw error if shelter tries to schedule home visit', async () => {
      const response = await request(app)
        .post('/application/scheduleHomeVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(403)

      expect(response.text).toEqual('Permission denied')
    })
  })

  describe('schedule shelter visit', () => {
    let user: User,
      shelter: Admin,
      applicationID: string,
      payload: ScheduleHomeVisitPayload

    const dateStr = moment().add(1, 'days').format('YYYY-MM-DD')
    const timeStr = moment().format('HH:mm')
    const dateTimeStr = `${dateStr}T${timeStr}`
    const dateTimeInUTC = moment(dateTimeStr).utc().format()
    const formattedDateTime = new Date(dateTimeInUTC).toLocaleString()

    let sendEmailSpy: jest.SpyInstance

    beforeEach(async () => {
      user = await generateUserandTokens()
      applicationID = await generatePetWithApplication(user.email)
      shelter = await generateAdminandTokens(Role.Shelter) // Assuming this is how you create a shelter user
      payload = {
        id: applicationID,
        visitDate: dateTimeInUTC
      }

      // Spy on the sendEmail function
      sendEmailSpy = jest.spyOn(sendEmailModule, 'sendEmail')
      sendEmailSpy.mockImplementation(() => Promise.resolve())
    })

    afterEach(async () => {
      await removeAllUsers()
      await removeAllApplications()
      await removeAllPets()
      jest.restoreAllMocks()
    })

    it('should successfully schedule a shelter visit', async () => {
      const expectedApplicantSubject = `Purrfect Adoptions - Shelter Visit Scheduled`
      const expectedApplicantMessage = `
    <p>We are pleased to inform you that your shelter visit for your application, ID: <strong>${applicationID}</strong>, has been successfully scheduled.</p>
    <p>The visit is set for: <strong>${formattedDateTime}</strong></p>
    <p>Please ensure that you are available at the scheduled time. During your visit, you will have the opportunity to meet the pet and assess if it's a good fit for you.</p>
    <p>If the visit is successful, we will then move on to the next step of the adoption process.</p>
    <p>Thank you for choosing Purrfect Adoptions!</p>
  `

      const expectedShelterSubject = `Purrfect Adoptions - Shelter Visit Scheduled`
      const expectedShelterMessage = `
    <p>A shelter visit for application ID: <strong>${applicationID}</strong> has been scheduled.</p>
    <p>The visit is set for: <strong>${formattedDateTime}</strong></p>
    <p>Please ensure that a representative and the pet are available for the visit. During the visit, observe the interaction between the applicant and the pet to assess their compatibility.</p>
    <p>Ensure to document any significant findings for review in the application process.</p>
    <p>Thank you for your dedication and hard work!</p>
  `

      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual('Shelter Visit has been scheduled')
      const updatedApplication = await Application.findById(applicationID)
      expect(updatedApplication?.status).toEqual(Status.UserVisitScheduled) // Verify the new status

      expect(sendEmailSpy).toBeCalledTimes(2)

      // Check email to applicant
      expect(sendEmailSpy).toBeCalledWith(
        user.email,
        expectedApplicantSubject,
        expectedApplicantMessage
      )

      // Check email to shelter
      expect(sendEmailSpy).toBeCalledWith(
        shelter.email,
        expectedShelterSubject,
        expectedShelterMessage
      )
    })

    it('should return an error if the application is not found', async () => {
      await removeAllApplications()

      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('Application not found')
      expect(response.body).toEqual({})
    })

    it('should return an error if the associated applicant is not found', async () => {
      await removeAllUsers(Role.User)
      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('Applicant not found')
      expect(response.body).toEqual({})
    })

    it('should return Bad Request if id is missing', async () => {
      const incompletePayload = {
        visitDate: dateTimeInUTC
      }

      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual('"id" is required')
    })

    it('should return Bad Request if visitDate is missing', async () => {
      const incompletePayload = {
        id: applicationID
      }

      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual('"visitDate" is required')
    })

    it('should return Bad Request if application id length is less than 24', async () => {
      payload.id = '123456'

      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toEqual('"id" length must be 24 characters long')
    })

    it('should return Bad Request if application id length is greater than 24', async () => {
      payload.id = '1234567890123456789012345'

      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      expect(response.text).toEqual('"id" length must be 24 characters long')
    })

    it('should return Bad Request if application id is a number', async () => {
      const invalidPayload = { id: 12345 }

      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(invalidPayload)
        .expect(400)

      expect(response.text).toEqual('"id" must be a string')
    })

    it('should return an error for a visitDate in the past', async () => {
      const pastDate = moment().subtract(1, 'days').utc().format()
      payload.visitDate = pastDate

      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      // const currentDateUTC = moment().utc().format('YYYY-MM-DDTHH:mm:ss')

      const receivedDateMatch = response.text.match(
        /"visitDate" must be greater than "(.*?)\.\d{3}Z"/
      )
      if (!receivedDateMatch) {
        throw new Error('Could not extract date from response')
      }

      const receivedDate = receivedDateMatch[1]

      // Calculate the difference in seconds between the received date and the current time
      const differenceInSeconds = moment(receivedDate).diff(
        moment().utc().format('YYYY-MM-DDTHH:mm:ss'),
        'seconds'
      )

      expect(Math.abs(differenceInSeconds)).toBeLessThanOrEqual(119) // Accept up to 119 seconds difference
    })

    it('should return an error for a visitDate more than a week from now', async () => {
      const farFutureDate = moment()
        .add(8, 'days')
        .startOf('day')
        .utc()
        .format()
      payload.visitDate = farFutureDate

      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(400)

      // Extract the date from the response text.
      const receivedDateMatch = response.text.match(
        /"visitDate" must be less than "(.*?)\.\d{3}Z"/
      )
      if (!receivedDateMatch) {
        throw new Error('Could not extract date from response')
      }

      const receivedDate = receivedDateMatch[1]

      // Calculate the difference in days between the received date and the current time.
      const differenceInDays = moment(receivedDate).diff(
        moment().utc().startOf('day'),
        'days'
      )

      expect(differenceInDays).toBe(7) // The date should be 7 days (1 week) from the current date
    })

    it('should throw Unauthorized if token is missing', async () => {
      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .send(payload)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })

    it('should throw error if user tries to schedule shelter visit', async () => {
      const response = await request(app)
        .post('/application/scheduleShelterVisit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(403)

      expect(response.text).toEqual('Permission denied')
    })
  })

  describe('update application status', () => {
    let user: User,
      shelter: Admin,
      applicationID,
      payload: UpdateApplicationPayload,
      sendEmailSpy: jest.SpyInstance,
      expectedRecipient,
      socketSpy: jest.SpyInstance
    const TOLERANCE_IN_SECONDS = 119

    beforeEach(async () => {
      user = await generateUserandTokens()
      shelter = await generateAdminandTokens(Role.Shelter)
      applicationID = await generatePetWithApplication(user.email)
      payload = {
        id: applicationID,
        status: Status.UnderReview
      }

      // Spy on the sendEmail function
      sendEmailSpy = jest.spyOn(sendEmailModule, 'sendEmail')
      sendEmailSpy.mockImplementation(() => Promise.resolve())

      socketSpy = jest.spyOn(socketModule, 'emitUserNotification')
      socketSpy.mockImplementation(() => Promise.resolve())
    })

    afterEach(async () => {
      await removeAllShelters()
      await removeAllApplications()
      jest.restoreAllMocks()
    })

    it('should throw error when application is not found', async () => {
      await removeAllApplications()
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('Application not found')
      expect(response.body).toEqual({})
    })

    it('should throw error when pet is not found', async () => {
      await removePets()
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('Pet not found')
      expect(response.body).toEqual({})
    })

    it('should throw error when user tries to update application status', async () => {
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(403)

      expect(response.text).toEqual('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw Unauthorized if token is missing', async () => {
      const response = await request(app)
        .put(`/application/updateStatus`)
        .send(payload)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
      expect(response.body).toEqual({})
    })

    it('should throw Bad Request if id is missing', async () => {
      const incompletePayload = {
        status: Status.UnderReview
      }
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual('"id" is required')
      expect(response.body).toEqual({})
    })

    it('should throw Bad Request if status is missing', async () => {
      const incompletePayload = {
        id: applicationID
      }
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual('"status" is required')
      expect(response.body).toEqual({})
    })

    it('should throw Bad Request if status is invalid', async () => {
      const incompletePayload = {
        id: applicationID,
        status: 'invalidStatus'
      }
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(incompletePayload)
        .expect(400)

      expect(response.text).toEqual(
        '"status" must be one of [Under Review, Home Visit Requested, Home Visit Scheduled, Home Approved, Home Rejected, User Visit Scheduled, Approved, Rejected, Closed, Expired, Reactivation Requested, Reactivation Request Approved, Reactivation Request Declined]'
      )
      expect(response.body).toEqual({})
    })

    it('should successfully update application status to HomeVisitRequested', async () => {
      const expectedSubject = `Purrfect Adoptions - Home Visit Request`
      const expectedNextWeekDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      )
      const formattedNextWeekDate = expectedNextWeekDate.toLocaleDateString()

      const expectedMessage = `
    <p>Dear Applicant,</p>
    <p>Your application for adoption, ID: <strong>${applicationID}</strong>, has reached the stage where a home visit is required.</p>
    <p>As part of our process, we ask that you schedule this visit within the next week, by <strong>${formattedNextWeekDate}</strong>. This visit is an important step in ensuring that the pet will be comfortable and secure in their potential new home.</p>
    <p><strong>Note:</strong> If you'd like to schedule your visit, please do so at least one day in advance to allow the shelter time for preparations.</p>
    <p><strong>Important:</strong> If you do not schedule your visit by the aforementioned date, your application will be marked as "expired." Should this happen, you'll need to request to reactivate your application to proceed further.</p>
    <p>Please click <a href="http://127.0.0.1:5173/${applicationID}/scheduleHomeVisit">here</a> to schedule your home visit.</p>
    <p>If you have any questions or require any assistance, please feel free to respond to this email.</p>
    <p>Thank you for your cooperation and your interest in adopting.</p>
    <p>Best,</p>
    <p>The Purrfect Adoptions Team</p>
  `
      payload.status = Status.HomeVisitRequested
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual('Request sent successfully')
      const application = await Application.findOne({ _id: applicationID })
      expect(application?.status).toEqual(Status.HomeVisitRequested)

      // Check that sendEmail was called with the correct arguments.
      expect(sendEmailSpy).toBeCalledTimes(1)
      expectedRecipient = user.email
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expectedRecipient,
        expectedSubject,
        expectedMessage
      )

      const actualNextWeekDate = new Date(formattedNextWeekDate)
      const differenceInDays = dateDifferenceInDays(
        actualNextWeekDate,
        expectedNextWeekDate
      )

      expect(differenceInDays).toBeLessThanOrEqual(7)

      expect(socketSpy).toHaveBeenCalledTimes(1)
      // Destructure the arguments with which the function has been called
      const [emailArg, notificationArg] = socketSpy.mock.calls[0]

      // Perform checks on individual fields
      expect(emailArg).toEqual('test@gmail.com')
      expect(notificationArg.status).toEqual(Status.HomeVisitRequested)
    })

    it('should successfully update application status to HomeApproved', async () => {
      const expectedSubject = `Purrfect Adoptions - Home Approved`
      const currentTime = new Date()
      const formattedDate = currentTime.toLocaleString()
      const expectedMessage = `
    <p>We are thrilled to inform you that your home visit for your application, ID: <strong>${applicationID}</strong>, has been successful.</p>
    <p>The approval was confirmed on: <strong>${formattedDate}</strong></p>
    <p>The next step of the adoption process will be your scheduled visit to our shelter. We will be in touch soon with scheduling details.</p>
    <p>Thank you for your cooperation and patience during this process. We appreciate your commitment to providing a loving home for our pets.</p>
  `

      payload.status = Status.HomeApproved
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Application status updated successfully'
      )
      const application = await Application.findOne({ _id: applicationID })
      expect(application?.status).toEqual(Status.HomeApproved)

      // Check that sendEmail was called with the correct arguments.
      expect(sendEmailSpy).toBeCalledTimes(1)
      expectedRecipient = user.email
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expectedRecipient,
        expectedSubject,
        expectedMessage
      )

      // Extract the actual date from the expectedMessage
      const dateRegex =
        /The approval was confirmed on: <strong>([^<]+)<\/strong><\/p>/
      const match = expectedMessage.match(dateRegex)
      if (match && match[1]) {
        const actualDate = new Date(match[1])
        const differenceInSeconds = dateDifferenceInSeconds(
          currentTime,
          actualDate
        )

        expect(differenceInSeconds).toBeLessThanOrEqual(TOLERANCE_IN_SECONDS)
      } else {
        throw new Error('Date not found in the expectedMessage')
      }

      expect(socketSpy).toHaveBeenCalledTimes(1)
      // Destructure the arguments with which the function has been called
      const [emailArg, notificationArg] = socketSpy.mock.calls[0]

      // Perform checks on individual fields
      expect(emailArg).toEqual('test@gmail.com')
      expect(notificationArg.status).toEqual(Status.HomeApproved)
    })

    it('should successfully update application status to HomeRejected', async () => {
      const expectedSubject = `Purrfect Adoptions - Home Visit Unsuccessful`
      const currentTime = new Date()
      const formattedDate = currentTime.toLocaleString()
      const expectedMessage = `
    <p>We regret to inform you that your home visit for your application, ID: <strong>${applicationID}</strong>, has not been successful.</p>
    <p>The decision was confirmed on: <strong>${formattedDate}</strong></p>
    <p>We understand this may be disappointing, and we want to assure you that this decision does not reflect upon you personally. Our primary concern is the well-being of our pets, and sometimes this means making difficult decisions.</p>
    <p>If you believe there have been changes to your living situation that may influence this decision, please feel free to reapply.</p>
    <p>Thank you for your understanding and your interest in providing a loving home for our pets.</p>
  `

      payload.status = Status.HomeRejected
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Application status updated successfully'
      )
      const application = await Application.findOne({ _id: applicationID })
      expect(application?.status).toEqual(Status.HomeRejected)

      // Check that sendEmail was called with the correct arguments.
      expect(sendEmailSpy).toBeCalledTimes(1)
      expectedRecipient = user.email
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expectedRecipient,
        expectedSubject,
        expectedMessage
      )

      // Extract the actual date from the expectedMessage
      const dateRegex =
        /The decision was confirmed on: <strong>([^<]+)<\/strong><\/p>/
      const match = expectedMessage.match(dateRegex)
      if (match && match[1]) {
        const actualDate = new Date(match[1])
        const differenceInSeconds = dateDifferenceInSeconds(
          currentTime,
          actualDate
        )

        expect(differenceInSeconds).toBeLessThanOrEqual(TOLERANCE_IN_SECONDS)
      } else {
        throw new Error('Date not found in the expectedMessage')
      }

      expect(socketSpy).toHaveBeenCalledTimes(1)
      // Destructure the arguments with which the function has been called
      const [emailArg, notificationArg] = socketSpy.mock.calls[0]

      // Perform checks on individual fields
      expect(emailArg).toEqual('test@gmail.com')
      expect(notificationArg.status).toEqual(Status.HomeRejected)
    })

    it('should successfully update application status to Rejected', async () => {
      const expectedApplicantSubject = `Purrfect Adoptions - Adoption Not Successful`
      const currentTime = new Date()
      const formattedDate = currentTime.toLocaleString()
      const expectedApplicantMessage = `
    <p>We regret to inform you that your application, ID: <strong>${applicationID}</strong>, did not result in an adoption.</p>
    <p>The decision was made on: <strong>${formattedDate}</strong></p>
    <p>We understand that not every visit or interaction leads to an adoption, and we encourage you to continue searching for the right pet. Our team is available to assist you in this journey.</p>
    <p>Thank you for considering adoption and for being a part of the Purrfect Adoptions community.</p>
  `
      const expectedShelterSubject =
        'Purrfect Adoptions - Adoption Not Finalized'
      const expectedShelterMessage = `
    <p>We regret to inform you that the potential adoption for the application, ID: <strong>${applicationID}</strong>, by applicant: <strong>${user.email}</strong> did not proceed.</p>
    <p>The decision was made on: <strong>${formattedDate}</strong></p>
    <p>We understand that not every visit or interaction leads to an adoption, and we are committed to ensuring the best fit for each pet. Your pet will be available again for other potential adopters.</p>
    <p>Thank you for your continuous dedication and care towards the animals. Your efforts make a significant difference.</p>
  `

      payload.status = Status.Rejected
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Application status updated successfully'
      )
      const application = await Application.findOne({ _id: applicationID })
      expect(application?.status).toEqual(Status.Rejected)

      // Check email to applicant
      expect(sendEmailSpy).toBeCalledTimes(2)
      expectedRecipient = user.email
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expectedRecipient,
        expectedApplicantSubject,
        expectedApplicantMessage
      )

      // Check email to shelter
      expect(sendEmailSpy).toBeCalledWith(
        shelter.email,
        expectedShelterSubject,
        expectedShelterMessage
      )

      const checkDateInMessage = (message) => {
        const dateRegex =
          /The decision was made on: <strong>([^<]+)<\/strong><\/p>/
        const match = message.match(dateRegex)
        if (match && match[1]) {
          const actualDate = new Date(match[1])
          const differenceInSeconds = dateDifferenceInSeconds(
            currentTime,
            actualDate
          )

          expect(differenceInSeconds).toBeLessThanOrEqual(TOLERANCE_IN_SECONDS)
        } else {
          throw new Error('Date not found in the expectedMessage')
        }
      }

      checkDateInMessage(expectedApplicantMessage)
      checkDateInMessage(expectedShelterMessage)

      expect(socketSpy).toHaveBeenCalledTimes(1)
      // Destructure the arguments with which the function has been called
      const [emailArg, notificationArg] = socketSpy.mock.calls[0]

      // Perform checks on individual fields
      expect(emailArg).toEqual('test@gmail.com')
      expect(notificationArg.status).toEqual(Status.Rejected)
    })

    it('should successfully update application status to Approved', async () => {
      const application2ID = await generatePetWithApplication('test2@gmail.com')

      const expectedApplicantSubject = `Purrfect Adoptions - Adoption Successful`
      const currentTime = new Date()
      const formattedDate = currentTime.toLocaleString()
      const expectedApplicantMessage = `
    <p>Congratulations! We are pleased to inform you that your application, ID: <strong>${applicationID}</strong>, has resulted in a successful adoption.</p>
    <p>The adoption was confirmed on: <strong>${formattedDate}</strong></p>
    <p>We are thrilled to see another pet find a loving home and wish you all the best on this new journey. Don't hesitate to reach out if you have any queries or need support.</p>
    <p>Thank you for your commitment to animal adoption and for being a part of the Purrfect Adoptions community.</p>
  `
      const expectedShelterSubject = `Purrfect Adoptions - Adoption Finalized`
      const expectedShelterMessage = `
    <p>We're delighted to inform you that the adoption for the application, ID: <strong>${applicationID}</strong>, by applicant: <strong>${user.email}</strong> has been successfully completed.</p>
    <p>The adoption was confirmed on: <strong>${formattedDate}</strong></p>
    <p>This marks another successful pet adoption from your shelter, contributing towards our mission of finding homes for all animals in need.</p>
    <p>Thank you for your continuous dedication and care towards the animals. Your efforts make a significant difference.</p>
  `
      const expectedOtherApplicantSubject = `Purrfect Adoptions - Pet Adoption Update`
      const expectedOtherApplicantMessage = `
    <p>Dear applicant,</p>
    <p>We hope this message finds you well. We are reaching out to inform you that the pet you applied for, application ID: <strong>${application2ID}</strong>, has found a new home.</p>
    <p>We understand that you may be disappointed, and we appreciate your understanding. There are many other pets in need of a loving home, and we encourage you to consider applying for another pet.</p>
    <p>Thank you for your interest in providing a home for our pets. Your compassion makes a huge difference in their lives.</p>
  `

      payload.status = Status.Approved

      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Application status updated successfully'
      )
      const application = await Application.findOne({ _id: applicationID })
      expect(application?.status).toEqual(Status.Approved)
      const application2 = await Application.findOne({ _id: application2ID })
      expect(application2?.status).toEqual(Status.Closed)
      const pet = await Pet.findOne({ microchipID: 'A123456789' })
      expect(pet?.isAdopted).toEqual(true)

      // Check email to applicant
      expect(sendEmailSpy).toBeCalledTimes(3)
      expectedRecipient = user.email
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expectedRecipient,
        expectedApplicantSubject,
        expectedApplicantMessage
      )

      // Check email to shelter
      expect(sendEmailSpy).toBeCalledWith(
        shelter.email,
        expectedShelterSubject,
        expectedShelterMessage
      )

      // Check email to other applicant
      expect(sendEmailSpy).toBeCalledWith(
        'test2@gmail.com',
        expectedOtherApplicantSubject,
        expectedOtherApplicantMessage
      )

      const checkDateInMessage = (message) => {
        const dateRegex =
          /The adoption was confirmed on: <strong>([^<]+)<\/strong><\/p>/
        const match = message.match(dateRegex)
        if (match && match[1]) {
          const actualDate = new Date(match[1])
          const differenceInSeconds = dateDifferenceInSeconds(
            currentTime,
            actualDate
          )

          expect(differenceInSeconds).toBeLessThanOrEqual(TOLERANCE_IN_SECONDS)
        } else {
          throw new Error('Date not found in the expectedMessage')
        }
      }

      checkDateInMessage(expectedApplicantMessage)
      checkDateInMessage(expectedShelterMessage)

      expect(socketSpy).toHaveBeenCalledTimes(1)
      // Destructure the arguments with which the function has been called
      const [emailArg, notificationArg] = socketSpy.mock.calls[0]

      // Perform checks on individual fields
      expect(emailArg).toEqual('test@gmail.com')
      expect(notificationArg.status).toEqual(Status.Approved)
    })

    it('should successfully update application status to ReactivationRequestApproved', async () => {
      const expectedSubject = `Purrfect Adoptions - Reactivation Request Approved`
      const expectedMessage = `
    <p>Good news! We are pleased to inform you that your reactivation request for application ID: <strong>${applicationID}</strong> has been approved.</p>
    <p>You now have the opportunity to schedule your home visit within the next <strong>48 hours</strong>. Please note that failure to schedule within this timeframe will result in the permanent closure of your application.</p>
    <p>We are committed to helping pets find loving homes, and we're excited to move forward with your application. If you have any questions or require further clarification, please don't hesitate to reach out.</p>
    <p>Thank you for your commitment to animal adoption and for being a part of the Purrfect Adoptions community.</p>
  `
      payload.status = Status.ReactivationRequestApproved
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Application status updated successfully'
      )
      const application = await Application.findOne({ _id: applicationID })
      console.log(application?.status)
      expect(application?.status).toEqual(Status.HomeVisitRequested)

      // Check that sendEmail was called with the correct arguments.
      expect(sendEmailSpy).toBeCalledTimes(1)
      expectedRecipient = user.email
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expectedRecipient,
        expectedSubject,
        expectedMessage
      )

      // Destructure the arguments with which the function has been called
      const [emailArg, notificationArg] = socketSpy.mock.calls[0]

      // Perform checks on individual fields
      expect(emailArg).toEqual('test@gmail.com')
      expect(notificationArg.status).toEqual(Status.ReactivationRequestApproved)
    })

    it('should successfully update application status to ReactivationRequestDeclined', async () => {
      const expectedSubject = `Purrfect Adoptions - Reactivation Request Declined`
      const expectedMessage = `
    <p>We regret to inform you that your reactivation request for application ID: <strong>${applicationID}</strong> has been declined.</p>
    <p>This means that your application has been permanently closed and will no longer be processed for further steps.</p>
    <p>If you are still interested in adopting, you may start a new application. However, we recommend reaching out to our team for more information on why your application was declined before proceeding.</p>
    <p>We understand that this news might be disappointing. Our team is committed to ensuring that all adoptions are well-suited to both the applicant and the pet.</p>
    <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
    <p>Thank you for your interest in animal adoption and for being a part of the Purrfect Adoptions community.</p>
  `
      payload.status = Status.ReactivationRequestDeclined
      const response = await request(app)
        .put(`/application/updateStatus`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Application status updated successfully'
      )
      const application = await Application.findOne({ _id: applicationID })
      console.log(application?.status)
      expect(application?.status).toEqual(Status.Closed)

      // Check that sendEmail was called with the correct arguments.
      expect(sendEmailSpy).toBeCalledTimes(1)
      expectedRecipient = user.email
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expectedRecipient,
        expectedSubject,
        expectedMessage
      )

      // Destructure the arguments with which the function has been called
      const [emailArg, notificationArg] = socketSpy.mock.calls[0]

      // Perform checks on individual fields
      expect(emailArg).toEqual('test@gmail.com')
      expect(notificationArg.status).toEqual(Status.ReactivationRequestDeclined)
    })
  })
})

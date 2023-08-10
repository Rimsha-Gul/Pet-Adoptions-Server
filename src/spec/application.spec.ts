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
  removeAllPets,
  removePets
} from './utils/generatePet'
import { Role, User as UserModel } from '../models/User'
import { Pet as PetModel } from '../models/Pet'
import {
  generateApplications,
  generateApplication,
  generateApplicationData,
  removeAllApplications
} from './utils/generateApplication'
import { removeAllShelters } from './utils/generateShelters'
import {
  Application as ApplicationModel,
  ResidenceType
} from '../models/Application'

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

  describe('get application details for user', () => {
    let user: User, shelter: Admin, applicationID

    beforeEach(async () => {
      user = await generateUserandTokens()
      shelter = await generateAdminandTokens(Role.Shelter)
      applicationID = await generatePetWithApplication()
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
      console.log(response.body.applications)

      expect(response.body.applications.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
    })

    it('should filter applications whose shelter name has 2(Shelter 2) in it and return 200', async () => {
      const response = await request(app)
        .get(`/application/applications?searchQuery=2`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)
      console.log(response.body.applications)

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
})

import { Pet, generatePets, petData, removeAllPets } from './utils/generatePet'
import { app } from '../app'
import {
  Admin,
  generateAdminandTokens,
  removeAllUsers
} from './utils/generateUserAndToken'
import { dropCollections, dropDatabase, mongooseSetUp } from './utils/setup'
import request from 'supertest'
import { generateShelters, removeAllShelters } from './utils/generateShelters'
import tmp from 'tmp-promise'
import multer from 'multer'
import { PetController } from '../controllers/pet'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import express from 'express'
import { Pet as PetModel } from '../models/Pet'
import { isShelter } from '../middleware/isShelter'
import User, { Role } from '../models/User'
import { Category } from '../models/Pet'
import { calculateAgeFromBirthdate } from '../utils/calculateAgeFromBirthdate'
import { generateAccessToken } from '../utils/generateAccessToken'

describe('pet', () => {
  beforeAll(async () => {
    await mongooseSetUp()
  })

  afterEach(async () => {
    await dropCollections()
  })

  afterAll(async () => {
    await dropDatabase()
  })

  describe('add a pet', () => {
    let user: Admin
    let pet: Pet

    const userCheck = [
      'pet add a pet should throw an error if a user(Role: USER) tries to add a pet'
    ]

    beforeEach(async () => {
      await mockFileUpload()
      const currentTestName = expect.getState().currentTestName
      if (!userCheck.includes(currentTestName || ''))
        user = await generateAdminandTokens(Role.Shelter)

      await generateShelters()

      const shelters = await User.find({ role: 'SHELTER' })
      pet = petData
      pet.shelterID = shelters[0]._id
    })
    afterEach(async () => {
      await removeAllUsers()
      await removeAllPets()
      await removeAllShelters()
    })

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

    let tmpFilePath, tmpFilePath2, tmpFilePath3, cleanup, cleanup2, cleanup3
    const server = express()

    const mockFileUpload = async () => {
      const result1 = await tmp.file({ postfix: '.jpg' })
      tmpFilePath = result1.path
      cleanup = result1.cleanup

      const result2 = await tmp.file({ postfix: '.jpg' })
      tmpFilePath2 = result2.path
      cleanup2 = result2.cleanup

      const result3 = await tmp.file({ postfix: '.jpg' })
      tmpFilePath3 = result3.path
      cleanup3 = result3.cleanup

      const upload = multer({ storage: multer.memoryStorage() }) // Use multer's memory storage
      const controller = new PetController()

      server.post(
        '/pet/',
        authenticateAccessToken,
        isShelter,
        upload.array('images', 10),
        async (req, res) => {
          try {
            // Handle the request here
            const {
              microchipID,
              name,
              gender,
              birthDate,
              color,
              breed,
              category,
              activityNeeds,
              levelOfGrooming,
              isHouseTrained,
              healthCheck,
              allergiesTreated,
              wormed,
              heartwormTreated,
              vaccinated,
              deSexed,
              bio,
              traits,
              adoptionFee,
              shelterID
            } = req.body
            if (req.file) {
              if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).send('Only image files are allowed')
              }
            }

            const profilePhotoIds = [
              'mockFileId1',
              'mockFileId2',
              'mockFileId3'
            ]

            const response = await controller.addPet(
              microchipID,
              name,
              gender,
              birthDate,
              color,
              breed,
              category,
              activityNeeds,
              levelOfGrooming,
              isHouseTrained,
              healthCheck,
              allergiesTreated,
              wormed,
              heartwormTreated,
              vaccinated,
              deSexed,
              bio,
              traits,
              adoptionFee,
              profilePhotoIds,
              req,
              shelterID
            )
            // Send the response
            return res.send(response)
          } catch (err: any) {
            return res.status(err.code).send(err.message)
          }
        }
      )
    }

    it('should successfully add a pet with all fields provided', async () => {
      const response = await request(server)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(200)

      expect(response.body.pet).not.toBeNull()

      await cleanup() // Delete the temporary files after the test
      await cleanup2()
      await cleanup3()
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentEmailToken = generateAccessToken(
        'nonexistent@gmail.com',
        'SHELTER'
      )

      const response = await request(app)
        .post('/pet/')
        .auth(nonExistentEmailToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if no token is provided', async () => {
      const response = await request(app)
        .post('/pet/')
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
      expect(response.body).toEqual({})
    })

    it('should throw an error if a user(Role: USER) tries to add a pet', async () => {
      user = await generateAdminandTokens(Role.User)
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(403)

      expect(response.text).toEqual('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should not add a pet if it already exists', async () => {
      await generatePets()
      const pets = await PetModel.find({})
      pet.microchipID = pets[0].microchipID

      const response = await request(server)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual('Pet already exists')
      expect(response.body).toEqual({})

      await removeAllPets()
      await cleanup() // Delete the temporary files after the test
      await cleanup2()
      await cleanup3()
    })

    it('should throw an error if no image file is provided', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .expect(400)

      expect(response.text).toEqual('No image file provided.')
      expect(response.body).toEqual({})
    })

    it('should throw an error if microchip ID is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"microchipID" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if name is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"name" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if gender is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"gender" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if birthDate is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"birthDate" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if color is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"color" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if breed is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"breed" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if category is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"category" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if activityNeeds is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"activityNeeds" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if levelOfGrooming is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"levelOfGrooming" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if isHouseTrained is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"isHouseTrained" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if healthCheck is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"healthCheck" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if allergiesTreated is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"allergiesTreated" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if wormed is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"wormed" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if heartwormTreated is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"heartwormTreated" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if vaccinated is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"vaccinated" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if deSexed is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"deSexed" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if bio is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"bio" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if traits is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"traits" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if adoptionFee is missing', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"adoptionFee" is required`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if microchip ID is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', '')
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"microchipID" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if name is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', '')
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"name" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if gender is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', '')
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"gender" must be one of [MALE, FEMALE]`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if birthDate is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', '')
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"birthDate" must be a valid date`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if color is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', '')
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"color" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if breed is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', '')
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"breed" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if category is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', '')
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(
        `"category" must be one of [CAT, DOG, HORSE, RABBIT, BIRD, SMALL_AND_FURRY, SCALES_FINS_AND_OTHERS, BARNYARD]`
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if activityNeeds is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', '')
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(
        `"activityNeeds" must be one of [LOW, VERY_LOW, MIDRANGE, HIGH, VERY_HIGH]`
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if levelOfGrooming is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', '')
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(
        `"levelOfGrooming" must be one of [LOW, MEDIUM, HIGH]`
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if isHouseTrained is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', '')
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"isHouseTrained" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if healthCheck is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', '')
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"healthCheck" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if allergiesTreated is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', '')
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"allergiesTreated" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if wormed is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', '')
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"wormed" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if heartwormTreated is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', '')
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"heartwormTreated" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if vaccinated is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', '')
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"vaccinated" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if deSexed is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', '')
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"deSexed" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if bio is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', '')
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"bio" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if traits is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', '')
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"traits" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if adoptionFee is emppty', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', '')
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"adoptionFee" is not allowed to be empty`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if gender is invalid enum type', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', 'Male') // should be MALE
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"gender" must be one of [MALE, FEMALE]`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if category is invalid enum type', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', 'Cat') // should be CAT
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(
        `"category" must be one of [CAT, DOG, HORSE, RABBIT, BIRD, SMALL_AND_FURRY, SCALES_FINS_AND_OTHERS, BARNYARD]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if activityNeeds is invalid enum type', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', 'Low') // should be LOW
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(
        `"activityNeeds" must be one of [LOW, VERY_LOW, MIDRANGE, HIGH, VERY_HIGH]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if levelOfGrooming is invalid enum type', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', 'Medium') // should be MEDIUM
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(
        `"levelOfGrooming" must be one of [LOW, MEDIUM, HIGH]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if isHouseTrained is number', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', 1)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"isHouseTrained" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if healthCheck is number', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', 1)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"healthCheck" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if allergiesTreated is number', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', 1)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"allergiesTreated" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if wormed is number', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', 1)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"wormed" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if heartwormTreated is number', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', 1)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"heartwormTreated" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if vaccinated is number', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', 1)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"vaccinated" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if deSexed is number', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', 1)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"deSexed" must be a boolean`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if microchipID has length less than 10', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', '123456')
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(
        `"microchipID" length must be 10 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if name has length less than 3', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', 'Ar')
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(
        `"name" length must be at least 3 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if name has length greater than 32', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', 'Abcdefghijklmnopqrstuvwxyzabcdefghi')
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(
        `"name" length must be less than or equal to 32 characters long`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if birthdate is in future', async () => {
      const response = await request(app)
        .post('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', Date.now() + 60 * 1000)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', pet.levelOfGrooming)
        .field('isHouseTrained', pet.isHouseTrained)
        .field('healthCheck', pet.healthCheck)
        .field('allergiesTreated', pet.allergiesTreated)
        .field('wormed', pet.wormed)
        .field('heartwormTreated', pet.heartwormTreated)
        .field('vaccinated', pet.vaccinated)
        .field('deSexed', pet.deSexed)
        .field('bio', pet.bio)
        .field('traits', pet.traits)
        .field('adoptionFee', pet.adoptionFee)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)
        .expect(400)

      expect(response.text).toEqual(`"birthDate" must be less than "now"`)
      expect(response.body).toEqual({})
    })
  })

  describe('get pets', () => {
    let user: Admin

    beforeEach(async () => {
      user = await generateAdminandTokens(Role.Shelter)
      await generatePets()
    })
    afterEach(async () => {
      await removeAllUsers()
      //await removeAllPets()
    })

    it('should successfully fetch all pets without filters and return 200', async () => {
      const response = await request(app)
        .get('/pet/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.totalPages).toEqual(3)
    })

    it('should successfully fetch first 6 pets from page 1(default PAGE=1 and return 200', async () => {
      const response = await request(app)
        .get('/pet?limit=6')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(6)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should successfully fetch first 6 pets from page 1 and return 200', async () => {
      const response = await request(app)
        .get('/pet?page=1&limit=6')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(6)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should successfully fetch first 2 pets from page 2 and return 200', async () => {
      const response = await request(app)
        .get('/pet?page=2&limit=6')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(2)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should successfully fetch first 3(default LIMIT=3) pets from page 1 and return 200', async () => {
      const response = await request(app)
        .get('/pet?page=1')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(3)
      expect(response.body.totalPages).toEqual(3)
    })

    it('should successfully fetch default first 3(default LIMIT=3) pets from page 2 and return 200', async () => {
      const response = await request(app)
        .get('/pet?page=2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(3)
      expect(response.body.totalPages).toEqual(3)
    })

    it('should successfully fetch default first 2(default LIMIT=3) pets from page 3 and return 200', async () => {
      const response = await request(app)
        .get('/pet?page=3')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(2)
      expect(response.body.totalPages).toEqual(3)
    })

    it('should return zero pets on filter pets by category=BARNYARD and return 200', async () => {
      await removeAllPets(Category.Barnyard)
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is BARNYARD on filter pets by category=BARNYARD and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'BARNYARD')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=BIRD and return 200', async () => {
      await removeAllPets(Category.Bird)
      const response = await request(app)
        .get('/pet?filterOption=BIRD')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is BIRD on filter pets by category=BIRD and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BIRD')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'BIRD')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=CAT and return 200', async () => {
      await removeAllPets(Category.Cat)
      const response = await request(app)
        .get('/pet?filterOption=CAT')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is CAT on filter pets by category=CAT and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=CAT')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'CAT')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=DOG and return 200', async () => {
      await removeAllPets(Category.Dog)
      const response = await request(app)
        .get('/pet?filterOption=DOG')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is DOG on filter pets by category=DOG and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=DOG')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'DOG')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=HORSE and return 200', async () => {
      await removeAllPets(Category.Horse)
      const response = await request(app)
        .get('/pet?filterOption=HORSE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is HORSE on filter pets by category=HORSE and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=HORSE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'HORSE')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=RABBIT and return 200', async () => {
      await removeAllPets(Category.Rabbit)
      const response = await request(app)
        .get('/pet?filterOption=RABBIT')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is RABBIT on filter pets by category=RABBIT and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=RABBIT')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'RABBIT')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=SCALES_FINS_AND_OTHERS and return 200', async () => {
      await removeAllPets(Category.ScalesFinsAndOthers)
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is SCALES_FINS_AND_OTHERS on filter pets by category=SCALES_FINS_AND_OTHERS and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'SCALES_FINS_AND_OTHERS'
        )
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=SMALL_AND_FURRY and return 200', async () => {
      await removeAllPets(Category.SmallAndFurry)
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is SMALL_AND_FURRY on filter pets by category=SMALL_AND_FURRY and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'SMALL_AND_FURRY'
        )
      ).toBe(true)
    })

    it('should filter Dogs by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=DOG&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'DOG' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Dogs by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=DOG&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Cats by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=CAT&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'CAT' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Cats by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=CAT&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Horses by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=HORSE&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'HORSE' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Horses by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=HORSE&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Rabbits by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=RABBIT&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'RABBIT' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Rabbits by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=RABBIT&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Birds by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BIRD&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'BIRD' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Birds by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BIRD&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Small and furry pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'SMALL_AND_FURRY' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Small and furry pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Scales and fins pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'SCALES_FINS_AND_OTHERS' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Scales and fins pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Barnyards pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'BARNYARD' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Barnyards pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Dogs by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=DOG&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'DOG' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Dogs by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=DOG&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Cats by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=CAT&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'CAT' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Cats by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=CAT&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Horses by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=HORSE&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'HORSE' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Horses by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=HORSE&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Rabbits by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=RABBIT&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'RABBIT' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Rabbits by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=RABBIT&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Birds by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BIRD&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'BIRD' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Birds by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BIRD&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Small and furry pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'SMALL_AND_FURRY' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Small and furry pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Scales and fins pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'SCALES_FINS_AND_OTHERS' &&
            pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Scales and fins pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Barnyard pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'BARNYARD' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Barnyard pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Dogs by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=DOG&genderFilter=MALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'DOG' && pet.gender === 'MALE'
        )
      ).toBe(true)
    })

    it('should return zero Dogs by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=DOG&genderFilter=FEMALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Cats by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=CAT&genderFilter=MALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'CAT' && pet.gender === 'MALE'
        )
      ).toBe(true)
    })

    it('should return zero Cats by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=CAT&genderFilter=FEMALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Horses by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=HORSE&genderFilter=MALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'HORSE' && pet.gender === 'MALE'
        )
      ).toBe(true)
    })

    it('should return zero Horses by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=HORSE&genderFilter=FEMALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Rabbits by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=RABBIT&genderFilter=MALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'RABBIT' && pet.gender === 'MALE'
        )
      ).toBe(true)
    })

    it('should return zero Rabbits by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=RABBIT&genderFilter=FEMALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Birds by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BIRD&genderFilter=MALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'BIRD' && pet.gender === 'MALE'
        )
      ).toBe(true)
    })

    it('should return zero Birds by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BIRD&genderFilter=FEMALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Small and furry pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY&genderFilter=MALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'SMALL_AND_FURRY' && pet.gender === 'MALE'
        )
      ).toBe(true)
    })

    it('should return zero Small and furry pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY&genderFilter=FEMALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Scales and fins pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS&genderFilter=MALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'SCALES_FINS_AND_OTHERS' && pet.gender === 'MALE'
        )
      ).toBe(true)
    })

    it('should return zero Scales and fins pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS&genderFilter=FEMALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Barnyard pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD&genderFilter=MALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'BARNYARD' && pet.gender === 'MALE'
        )
      ).toBe(true)
    })

    it('should return zero Barnyard pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD&genderFilter=FEMALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Dogs by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=DOG&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'DOG'
        })
      ).toBe(true)
    })

    it('should return zero Dogs by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=DOG&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Cats by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=CAT&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'CAT'
        })
      ).toBe(true)
    })

    it('should return zero Cats by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=CAT&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Horses by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=HORSE&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'HORSE'
        })
      ).toBe(true)
    })

    it('should return zero Horses by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=HORSE&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Rabbits by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=RABBIT&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'RABBIT'
        })
      ).toBe(true)
    })

    it('should return zero Rabbits by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=RABBIT&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Birds by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BIRD&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'BIRD'
        })
      ).toBe(true)
    })

    it('should return zero Birds by age and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BIRD&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Small and furry pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'SMALL_AND_FURRY'
        })
      ).toBe(true)
    })

    it('should return zero Small and furry pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SMALL_AND_FURRY&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Scales and fins pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return (
            age >= 1 && age <= 2 && pet.category === 'SCALES_FINS_AND_OTHERS'
          )
        })
      ).toBe(true)
    })

    it('should return zero Scales and fins pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=SCALES_FINS_AND_OTHERS&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Barnyard pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'BARNYARD'
        })
      ).toBe(true)
    })

    it('should return zero Barnyard pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pet?filterOption=BARNYARD&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should search pets by name or bio and return 200', async () => {
      const response = await request(app)
        .get('/pet?searchQuery=friendly')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(
        response.body.pets.some(
          (pet: Pet) =>
            pet.name.toLowerCase().includes('friendly') ||
            pet.bio.toLowerCase().includes('friendly')
        )
      ).toBe(true)
    })

    it('should respond with Bad Request if category is invalid enum type', async () => {
      const response = await request(app)
        .get('/pet?filterOption=Dog')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"filterOption" must be one of [CAT, DOG, HORSE, RABBIT, BIRD, SMALL_AND_FURRY, SCALES_FINS_AND_OTHERS, BARNYARD, ]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if gender is invalid enum type', async () => {
      const response = await request(app)
        .get('/pet?genderFilter=Male')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"genderFilter" must be one of [MALE, FEMALE, ]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if page is zero', async () => {
      const response = await request(app)
        .get('/pet?page=0')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"page" must be greater than or equal to 1`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if limit is zero', async () => {
      const response = await request(app)
        .get('/pet?limit=0')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"limit" must be greater than or equal to 1`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if page is a string', async () => {
      const response = await request(app)
        .get('/pet?page=page')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"page" must be a number`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if limit is a string', async () => {
      const response = await request(app)
        .get('/pet?limit=limit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"limit" must be a number`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if category is a number', async () => {
      const response = await request(app)
        .get('/pet?filterOption=1')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"filterOption" must be one of [CAT, DOG, HORSE, RABBIT, BIRD, SMALL_AND_FURRY, SCALES_FINS_AND_OTHERS, BARNYARD, ]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if gender is a number', async () => {
      const response = await request(app)
        .get('/pet?genderFilter=1')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"genderFilter" must be one of [MALE, FEMALE, ]`
      )
      expect(response.body).toEqual({})
    })
  })
})

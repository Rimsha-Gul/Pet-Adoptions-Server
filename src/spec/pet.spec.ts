import {
  generatePetWithApplication,
  Pet,
  generatePetData,
  generatePets,
  removeAllPets
} from './utils/generatePet'
import { app } from '../app'
import {
  Admin,
  generateAdminandTokens,
  generateUserandTokens,
  removeAllUsers
} from './utils/generateUserAndToken'
import { dropCollections, dropDatabase, mongooseSetUp } from './utils/setup'
import request from 'supertest'
import tmp from 'tmp-promise'
import multer from 'multer'
import { PetController } from '../controllers/pet'
import { authenticateAccessToken } from '../middleware/authenticateToken'
import express from 'express'
import { Pet as PetModel } from '../models/Pet'
import { isShelter } from '../middleware/isShelter'
import { Role, User as UserModel } from '../models/User'
import { Category } from '../models/Pet'
import { calculateAgeFromBirthdate } from '../utils/calculateAgeFromBirthdate'
import { generateAccessToken } from '../utils/generateAccessToken'
import { generateShelters, removeAllShelters } from './utils/generateShelters'
import { generateApplication } from './utils/generateApplication'

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

    let user: Admin
    let pet: Pet

    const userCheck = [
      'pet add a pet should throw an error if a user(Role: USER) tries to add a pet',
      'should throw an error if shelterID is invalid'
    ]

    let tmpFilePath, tmpFilePath2, tmpFilePath3, cleanup, cleanup2, cleanup3
    const server = express()

    beforeEach(async () => {
      await mockFileUpload()
      const currentTestName = expect.getState().currentTestName
      if (!userCheck.includes(currentTestName || ''))
        user = await generateAdminandTokens(Role.Shelter)

      pet = await generatePetData()
    })
    afterEach(async () => {
      await cleanup() // Delete the temporary files after the test
      await cleanup2()
      await cleanup3()
      await removeAllUsers()
      await removeAllPets()
    })

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
        '/pets/',
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

    it('should successfully add a pet by admin with all fields provided', async () => {
      user = await generateAdminandTokens(Role.Admin)
      const response = await request(server)
        .post('/pets/')
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
        .field('shelterID', pet.shelterID)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)

        .expect(200)

      expect(response.body.pet).not.toBeNull()
    })

    it('should successfully add a pet by shelter with all fields provided', async () => {
      const response = await request(server)
        .post('/pets/')
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
    })

    it('should throw an error if shelterID is invalid', async () => {
      user = await generateAdminandTokens(Role.Admin)
      pet.shelterID = '1111e9630044288a2b4880b5'

      const response = await request(server)
        .post('/pets/')
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
        .field('shelterID', pet.shelterID)
        .attach('images', tmpFilePath)
        .attach('images', tmpFilePath2)
        .attach('images', tmpFilePath3)

        .expect(404)

      expect(response.text).toEqual('Shelter not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user does not exist', async () => {
      const nonExistentEmailToken = generateAccessToken(
        'nonexistent@gmail.com',
        'SHELTER'
      )

      const response = await request(app)
        .post('/pets/')
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
        .expect(404)

      expect(response.text).toEqual('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if no token is provided', async () => {
      const response = await request(app)
        .post('/pets/')
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
      user = await generateUserandTokens()
      const response = await request(app)
        .post('/pets/')
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
        .expect(403)

      expect(response.text).toEqual('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should not add a pet if it already exists', async () => {
      await generatePets()
      const pets = await PetModel.find({})
      pet.microchipID = pets[0].microchipID

      const response = await request(server)
        .post('/pets/')
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
    })

    it('should throw an error if no image file is provided', async () => {
      const response = await request(app)
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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

      expect(response.text).toEqual(`"gender" must be one of [Male, Female]`)
      expect(response.body).toEqual({})
    })

    it('should throw an error if birthDate is emppty', async () => {
      const response = await request(app)
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        `"category" must be one of [Cat, Dog, Horse, Rabbit, Bird, Small and Furry, Scales, Fins and Others, Barnyard]`
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if activityNeeds is emppty', async () => {
      const response = await request(app)
        .post('/pets/')
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
        `"activityNeeds" must be one of [Low, Very Low, Midrange, High, Very High]`
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if levelOfGrooming is emppty', async () => {
      const response = await request(app)
        .post('/pets/')
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
        `"levelOfGrooming" must be one of [Low, Medium, High]`
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if isHouseTrained is emppty', async () => {
      const response = await request(app)
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', 'MALE') // should be Male
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

      expect(response.text).toEqual(`"gender" must be one of [Male, Female]`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if category is invalid enum type', async () => {
      const response = await request(app)
        .post('/pets/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', 'CAT') // should be Cat
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
        `"category" must be one of [Cat, Dog, Horse, Rabbit, Bird, Small and Furry, Scales, Fins and Others, Barnyard]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if activityNeeds is invalid enum type', async () => {
      const response = await request(app)
        .post('/pets/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', 'LOW') // should be Low
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
        `"activityNeeds" must be one of [Low, Very Low, Midrange, High, Very High]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if levelOfGrooming is invalid enum type', async () => {
      const response = await request(app)
        .post('/pets/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .field('microchipID', pet.microchipID)
        .field('name', pet.name)
        .field('gender', pet.gender)
        .field('birthDate', pet.birthDate)
        .field('color', pet.color)
        .field('breed', pet.breed)
        .field('category', pet.category)
        .field('activityNeeds', pet.activityNeeds)
        .field('levelOfGrooming', 'MEDIUM') // should be Medium
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
        `"levelOfGrooming" must be one of [Low, Medium, High]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if isHouseTrained is number', async () => {
      const response = await request(app)
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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
        .post('/pets/')
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

  describe('get a pet', () => {
    let user: Admin, petID: string

    beforeEach(async () => {
      petID = 'A123456799'
      user = await generateUserandTokens()
      await generatePets()
    })
    afterEach(async () => {
      await removeAllUsers()
      jest.restoreAllMocks()
    })

    it('should successfully fetch the pet', async () => {
      const response = await request(app)
        .get(`/pets/${petID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pet).toBeDefined()
      expect(response.body.pet.applicationID).toBeNull()
    })

    it('should respond with bad request if pet does not exist', async () => {
      petID = 'A123456789'
      const response = await request(app)
        .get(`/pets/${petID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Pet not found')
      expect(response.body).toEqual({})
    })

    it('should respond with bad request if shelter does not exist', async () => {
      await removeAllShelters()
      const response = await request(app)
        .get(`/pets/${petID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Shelter not found')
      expect(response.body).toEqual({})
    })

    it('should successfully fetch the pet with application ID if there is an application for that pet from that user', async () => {
      petID = 'A123456789'
      await generatePetWithApplication(user.email)
      const response = await request(app)
        .get(`/pets/${petID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pet).toBeDefined()
      expect(response.body.pet.applicationID).toBeDefined()
    })
  })

  describe('get pets', () => {
    let user: Admin, shelters

    beforeEach(async () => {
      user = await generateAdminandTokens(Role.Shelter)
      await generatePets()
      await generateShelters()
      shelters = await UserModel.find({ role: 'SHELTER' })
      await generateApplication(
        shelters[0]._id.toString(),
        'A123456799',
        user.email
      )
    })
    afterEach(async () => {
      await removeAllUsers()
      jest.restoreAllMocks()
    })

    it('should successfully fetch all pets without filters and return 200', async () => {
      const response = await request(app)
        .get('/pets')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.totalPages).toEqual(3)
    })

    it('should successfully fetch first 6 pets from page 1(default PAGE=1 and return 200', async () => {
      const response = await request(app)
        .get('/pets?limit=6')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(6)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should successfully fetch first 6 pets from page 1 and return 200', async () => {
      const response = await request(app)
        .get('/pets?page=1&limit=6')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(6)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should successfully fetch first 2 pets from page 2 and return 200', async () => {
      const response = await request(app)
        .get('/pets?page=2&limit=6')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(3)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should successfully fetch first 3(default LIMIT=3) pets from page 1 and return 200', async () => {
      const response = await request(app)
        .get('/pets?page=1')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(3)
      expect(response.body.totalPages).toEqual(3)
    })

    it('should successfully fetch default first 3(default LIMIT=3) pets from page 2 and return 200', async () => {
      const response = await request(app)
        .get('/pets?page=2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(3)
      expect(response.body.totalPages).toEqual(3)
    })

    it('should successfully fetch default first 2(default LIMIT=3) pets from page 3 and return 200', async () => {
      const response = await request(app)
        .get('/pets?page=3')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets).toBeInstanceOf(Array)
      expect(response.body.pets.length).toEqual(3)
      expect(response.body.totalPages).toEqual(3)
    })

    it('should return zero pets on filter pets by category=Barnyard and return 200', async () => {
      await removeAllPets(Category.Barnyard)
      const response = await request(app)
        .get('/pets?filterOption=Barnyard')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is Barnyard on filter pets by category=Barnyard and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Barnyard')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'Barnyard')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=Bird and return 200', async () => {
      await removeAllPets(Category.Bird)
      const response = await request(app)
        .get('/pets?filterOption=Bird')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is Bird on filter pets by category=Bird and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Bird')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'Bird')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=Cat and return 200', async () => {
      await removeAllPets(Category.Cat)
      const response = await request(app)
        .get('/pets?filterOption=Cat')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is Cat on filter pets by category=Cat and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'Cat')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=Dog and return 200', async () => {
      await removeAllPets(Category.Dog)
      const response = await request(app)
        .get('/pets?filterOption=Dog')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is Dog on filter pets by category=Dog and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'Dog')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=Horse and return 200', async () => {
      await removeAllPets(Category.Horse)
      const response = await request(app)
        .get('/pets?filterOption=Horse')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is Horse on filter pets by category=Horse and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Horse')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'Horse')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=Rabbit and return 200', async () => {
      await removeAllPets(Category.Rabbit)
      const response = await request(app)
        .get('/pets?filterOption=Rabbit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is Rabbit on filter pets by category=Rabbit and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Rabbit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every((pet: Pet) => pet.category === 'Rabbit')
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=Scales, Fins and Others and return 200', async () => {
      await removeAllPets(Category.ScalesFinsAndOthers)
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is Scales, Fins and Others on filter pets by category=Scales, Fins and Others and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Scales, Fins and Others'
        )
      ).toBe(true)
    })

    it('should return zero pets on filter pets by category=Small and Furry and return 200', async () => {
      await removeAllPets(Category.SmallAndFurry)
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should return pets whose category is Small and Furry on filter pets by category=Small and Furry and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.status).toBe(200)
      expect(response.body.pets.length).toEqual(2)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Small and Furry'
        )
      ).toBe(true)
    })

    it('should filter Dogs by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Dog' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Dogs by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Cats by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Cat' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Cats by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Horses by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Horse&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Horse' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Horses by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Horse&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Rabbits by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Rabbit&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Rabbit' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Rabbits by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Rabbit&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Birds by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Bird&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Bird' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Birds by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Bird&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Small and furry pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(2)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'Small and Furry' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Small and furry pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Scales and fins pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'Scales, Fins and Others' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Scales and fins pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Barnyards pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Barnyard&colorFilter=Brown')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Barnyard' && pet.color === 'Brown'
        )
      ).toBe(true)
    })

    it('should return zero Barnyards pets by color and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Barnyard&colorFilter=Black')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Dogs by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Dog' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Dogs by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Cats by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Cat' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Cats by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Horses by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Horse&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Horse' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Horses by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Horse&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Rabbits by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Rabbit&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Rabbit' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Rabbits by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Rabbit&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Birds by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Bird&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Bird' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Birds by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Bird&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Small and furry pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(2)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'Small and Furry' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Small and furry pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Scales and fins pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'Scales, Fins and Others' &&
            pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Scales and fins pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Barnyard pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Barnyard&breedFilter=Labrador')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Barnyard' && pet.breed === 'Labrador'
        )
      ).toBe(true)
    })

    it('should return zero Barnyard pets by breed and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Barnyard&breedFilter=Persian')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Dogs by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog&genderFilter=Male')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Dog' && pet.gender === 'Male'
        )
      ).toBe(true)
    })

    it('should return zero Dogs by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog&genderFilter=Female')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Cats by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat&genderFilter=Male')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Cat' && pet.gender === 'Male'
        )
      ).toBe(true)
    })

    it('should return zero Cats by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat&genderFilter=Female')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Horses by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Horse&genderFilter=Male')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Horse' && pet.gender === 'Male'
        )
      ).toBe(true)
    })

    it('should return zero Horses by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Horse&genderFilter=Female')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Rabbits by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Rabbit&genderFilter=Male')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Rabbit' && pet.gender === 'Male'
        )
      ).toBe(true)
    })

    it('should return zero Rabbits by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Rabbit&genderFilter=Female')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Birds by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Bird&genderFilter=Male')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Bird' && pet.gender === 'Male'
        )
      ).toBe(true)
    })

    it('should return zero Birds by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Bird&genderFilter=Female')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Small and furry pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry&genderFilter=Male')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(2)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'Small and Furry' && pet.gender === 'Male'
        )
      ).toBe(true)
    })

    it('should return zero Small and furry pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry&genderFilter=Female')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Scales and fins pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others&genderFilter=Male')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) =>
            pet.category === 'Scales, Fins and Others' && pet.gender === 'Male'
        )
      ).toBe(true)
    })

    it('should return zero Scales and fins pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others&genderFilter=Female')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Barnyard pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Barnyard&genderFilter=Male')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)
      expect(
        response.body.pets.every(
          (pet: Pet) => pet.category === 'Barnyard' && pet.gender === 'Male'
        )
      ).toBe(true)
    })

    it('should return zero Barnyard pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Barnyard&genderFilter=Female')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Dogs by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'Dog'
        })
      ).toBe(true)
    })

    it('should return zero Dogs by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Cats by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat&ageFilter=0-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 0 && age <= 2 && pet.category === 'Cat'
        })
      ).toBe(true)
    })

    it('should return zero Cats by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Horses by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Horse&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'Horse'
        })
      ).toBe(true)
    })

    it('should return zero Horses by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Horse&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Rabbits by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Rabbit&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'Rabbit'
        })
      ).toBe(true)
    })

    it('should return zero Rabbits by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Rabbit&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Birds by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Bird&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'Bird'
        })
      ).toBe(true)
    })

    it('should return zero Birds by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Bird&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Small and furry pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(2)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'Small and Furry'
        })
      ).toBe(true)
    })

    it('should return zero Small and furry pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Small and Furry&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Scales and fins pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return (
            age >= 1 && age <= 2 && pet.category === 'Scales, Fins and Others'
          )
        })
      ).toBe(true)
    })

    it('should return zero Scales and fins pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Scales, Fins and Others&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should filter Barnyard pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Barnyard&ageFilter=1-2')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && age <= 2 && pet.category === 'Barnyard'
        })
      ).toBe(true)
    })

    it('should return zero Barnyard pets by gender and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Barnyard&ageFilter=2-5')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(0)
      expect(response.body.totalPages).toEqual(0)
    })

    it('should search pets by name or bio and return 200', async () => {
      const response = await request(app)
        .get('/pets?searchQuery=friendly')
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
        .get('/pets?filterOption=DOG')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"filterOption" must be one of [Cat, Dog, Horse, Rabbit, Bird, Small and Furry, Scales, Fins and Others, Barnyard, ]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if gender is invalid enum type', async () => {
      const response = await request(app)
        .get('/pets?genderFilter=MALE')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"genderFilter" must be one of [Male, Female, ]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if page is zero', async () => {
      const response = await request(app)
        .get('/pets?page=0')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"page" must be greater than or equal to 1`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if limit is zero', async () => {
      const response = await request(app)
        .get('/pets?limit=0')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"limit" must be greater than or equal to 1`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if page is a string', async () => {
      const response = await request(app)
        .get('/pets?page=page')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"page" must be a number`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if limit is a string', async () => {
      const response = await request(app)
        .get('/pets?limit=limit')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(`"limit" must be a number`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if category is a number', async () => {
      const response = await request(app)
        .get('/pets?filterOption=1')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"filterOption" must be one of [Cat, Dog, Horse, Rabbit, Bird, Small and Furry, Scales, Fins and Others, Barnyard, ]`
      )
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if gender is a number', async () => {
      const response = await request(app)
        .get('/pets?genderFilter=1')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        `"genderFilter" must be one of [Male, Female, ]`
      )
      expect(response.body).toEqual({})
    })

    it('should return 500 when there is an internal server error', async () => {
      // Mock the find method to throw an error
      jest.spyOn(PetModel, 'aggregate').mockImplementation(() => {
        throw new Error('Failed to fetch pets')
      })

      const response = await request(app)
        .get('/pets')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(500)

      expect(response.text).toEqual('Failed to fetch pets')
      expect(response.body).toEqual({})
    })

    it('should filter Cats by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Cat&ageFilter=0-')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 0 && age < 1 && pet.category === 'Cat'
        })
      ).toBe(true)
    })

    it('should filter Dogs by age and return 200', async () => {
      const response = await request(app)
        .get('/pets?filterOption=Dog&ageFilter=-1')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.pets.length).toEqual(1)
      expect(response.body.totalPages).toEqual(1)

      expect(
        response.body.pets.every((pet: Pet) => {
          const birthdate = new Date(pet.birthDate)
          const age = calculateAgeFromBirthdate(birthdate)
          return age >= 1 && pet.category === 'Dog'
        })
      ).toBe(true)
    })
  })
})

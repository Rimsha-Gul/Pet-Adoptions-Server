import request from 'supertest'
import {
  User,
  generateAdminandTokens,
  generateUserandTokens,
  removeAllUsers
} from './utils/generateUserAndToken'
import { dropCollections, dropDatabase, mongooseSetUp } from './utils/setup'
import { app } from '../app'
import { generateShelters, removeAllShelters } from './utils/generateShelters'
import { Role, User as UserModel } from '../models/User'
import { generateReview, generateReviews } from './utils/generateReview'
import { generateAccessToken } from '../utils/generateAccessToken'

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

  describe('add review', () => {
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

    it('should successfully add a review and update the shelter rating', async () => {
      const originalShelter = shelters[0]
      const body = {
        shelterID: shelters[0]._id.toString(),
        rating: 5,
        reviewText: 'Great shelter!'
      }

      const response = await request(app)
        .post('/review/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(200)

      expect(response.body.message).toBe('Thank you for your feedback')
      // Check if the shelter rating has been updated
      const updatedShelter = await UserModel.findOne(shelters[0]._id)
      const newRating =
        (originalShelter.rating * originalShelter.numberOfReviews +
          body.rating) /
        (originalShelter.numberOfReviews + 1)

      expect(updatedShelter?.rating).toBeCloseTo(newRating)
      expect(updatedShelter?.numberOfReviews).toBe(
        originalShelter.numberOfReviews + 1
      )
    })

    it('should throw an error if a review already exists for this user and shelter', async () => {
      const body = {
        shelterID: shelters[0]._id.toString(),
        rating: 5,
        reviewText: 'Great shelter!'
      }
      await generateReview(body.shelterID)

      const response = await request(app)
        .post('/review/')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe('Review already exists')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user is not found', async () => {
      const nonExistentEmailToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )
      const body = {
        shelterID: 'someShelterId',
        rating: 5,
        reviewText: 'Great shelter!'
      }

      const response = await request(app)
        .post('/review/')
        .auth(nonExistentEmailToken, { type: 'bearer' })
        .send(body)
        .expect(404)

      expect(response.text).toBe('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter tries to add a review', async () => {
      const shelter = await generateAdminandTokens(Role.Shelter)
      const body = {
        shelterID: shelters[0]._id.toString(),
        rating: 5,
        reviewText: 'Great shelter!'
      }

      const response = await request(app)
        .post('/review/')
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(403)

      expect(response.text).toBe('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw an error if admin tries to add a review', async () => {
      const admin = await generateAdminandTokens(Role.Admin)
      const body = {
        shelterID: shelters[0]._id.toString(),
        rating: 5,
        reviewText: 'Great shelter!'
      }

      const response = await request(app)
        .post('/review/')
        .auth(admin.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(403)

      expect(response.text).toBe('Permission denied')
      expect(response.body).toEqual({})
    })
  })

  describe('get all reviews', () => {
    let user: User, shelters

    beforeEach(async () => {
      user = await generateUserandTokens()
      await generateShelters()
      shelters = await UserModel.find({ role: 'SHELTER' })
      await generateReviews(shelters[0]._id)
    })

    afterEach(async () => {
      await removeAllUsers()
      jest.restoreAllMocks()
    })

    it('should fetch the first page of reviews and return 200', async () => {
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.reviews).toBeInstanceOf(Array)
      expect(response.body.reviews).toHaveLength(3)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should fetch the second page of reviews and return 200', async () => {
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}&page=2`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.reviews).toBeInstanceOf(Array)
      expect(response.body.reviews).toHaveLength(2)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should fetch the first 4 reviews and return 200', async () => {
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}&limit=4`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.reviews).toBeInstanceOf(Array)
      expect(response.body.reviews).toHaveLength(4)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should handle non-existing pages', async () => {
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}&page=3`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.reviews).toBeInstanceOf(Array)
      expect(response.body.reviews).toHaveLength(0) // No reviews on non-existing pages
      expect(response.body.totalPages).toEqual(2)
    })

    it('should return an error when shelter ID is not provided', async () => {
      const response = await request(app)
        .get(`/review/all`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"id" is required')
    })

    it('should return an error for non-existent shelter', async () => {
      await removeAllShelters()
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Shelter not found')
    })

    it('should return an error when not authenticated', async () => {
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}`)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })

    it('should respond with Bad Request if limit value is invalid', async () => {
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}&limit=-1`) // Invalid limit
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        '"limit" must be greater than or equal to 1'
      )
    })

    it('should respond with Bad Request if page number is invalid', async () => {
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}&page=-1`) // Invalid page
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"page" must be greater than or equal to 1')
    })

    it('should respond with Bad Request if limit is a string', async () => {
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}&limit=limit`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"limit" must be a number')
    })

    it('should respond with Bad Request if page is a string', async () => {
      const response = await request(app)
        .get(`/review/all?id=${shelters[0]._id}&page=page`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"page" must be a number')
    })
  })
})
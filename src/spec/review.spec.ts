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
import {
  generateReview,
  generateReviews,
  removeAllReviews
} from './utils/generateReview'
import { generateAccessToken } from '../utils/generateAccessToken'
import { ReviewPayload } from 'src/models/Review'

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
    let user: User, shelters, shelterID, body: ReviewPayload

    beforeEach(async () => {
      user = await generateUserandTokens()
      await generateShelters()
      shelters = await UserModel.find({ role: 'SHELTER' })
      shelterID = shelters[0]._id
      body = {
        rating: 5,
        reviewText: 'Great shelter!'
      }
    })

    afterEach(async () => {
      await removeAllUsers()
      jest.restoreAllMocks()
    })

    it('should successfully add a review and update the shelter rating', async () => {
      const originalShelter = shelters[0]

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
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
      await generateReview(shelterID)

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
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
      shelterID = 'someShelterId'

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(nonExistentEmailToken, { type: 'bearer' })
        .send(body)
        .expect(404)

      expect(response.text).toBe('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter is not found', async () => {
      await removeAllShelters()
      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(404)

      expect(response.text).toBe('Shelter not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter tries to add a review', async () => {
      const shelter = await generateAdminandTokens(Role.Shelter)

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(403)

      expect(response.text).toBe('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw an error if admin tries to add a review', async () => {
      const admin = await generateAdminandTokens(Role.Admin)

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(admin.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(403)

      expect(response.text).toBe('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw an error if rating is missing', async () => {
      const incompleteBody = {
        reviewText: 'Great shelter!'
      }

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(incompleteBody)
        .expect(400)

      expect(response.text).toBe('"rating" is required')
      expect(response.body).toEqual({})
    })

    it('should throw an error if review text is missing', async () => {
      const incompleteBody = {
        rating: 5
      }

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(incompleteBody)
        .expect(400)

      expect(response.text).toBe('"reviewText" is required')
      expect(response.body).toEqual({})
    })

    it('should throw an error if rating is empty', async () => {
      body.reviewText = ''

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe('"reviewText" is not allowed to be empty')
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter ID is less than 24 characters long', async () => {
      shelterID = '123456'

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe(
        '"shelterID" length must be 24 characters long'
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter ID is greater than 24 characters long', async () => {
      shelterID = '1234567890123456789012345'

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe(
        '"shelterID" length must be 24 characters long'
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if rating is less than 1', async () => {
      body.rating = 0

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe('"rating" must be greater than or equal to 1')
      expect(response.body).toEqual({})
    })

    it('should throw an error if rating is greater than 5', async () => {
      body.rating = 6

      const response = await request(app)
        .post(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe('"rating" must be less than or equal to 5')
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
        .get(`/reviews/${shelters[0]._id}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.reviews).toBeInstanceOf(Array)
      expect(response.body.reviews).toHaveLength(3)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should fetch the second page of reviews and return 200', async () => {
      const response = await request(app)
        .get(`/reviews/${shelters[0]._id}?page=2`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.reviews).toBeInstanceOf(Array)
      expect(response.body.reviews).toHaveLength(2)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should fetch the first 4 reviews and return 200', async () => {
      const response = await request(app)
        .get(`/reviews/${shelters[0]._id}?limit=4`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.reviews).toBeInstanceOf(Array)
      expect(response.body.reviews).toHaveLength(4)
      expect(response.body.totalPages).toEqual(2)
    })

    it('should handle non-existing pages', async () => {
      const response = await request(app)
        .get(`/reviews/${shelters[0]._id}?page=3`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.reviews).toBeInstanceOf(Array)
      expect(response.body.reviews).toHaveLength(0) // No reviews on non-existing pages
      expect(response.body.totalPages).toEqual(2)
    })

    it('should return an error for non-existent shelter', async () => {
      await removeAllShelters()
      const response = await request(app)
        .get(`/reviews/${shelters[0]._id}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('Shelter not found')
    })

    it('should return an error when not authenticated', async () => {
      const response = await request(app)
        .get(`/reviews/${shelters[0]._id}`)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })

    it('should respond with Bad Request if limit value is invalid', async () => {
      const response = await request(app)
        .get(`/reviews/${shelters[0]._id}?limit=-1`) // Invalid limit
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual(
        '"limit" must be greater than or equal to 1'
      )
    })

    it('should respond with Bad Request if page number is invalid', async () => {
      const response = await request(app)
        .get(`/reviews/${shelters[0]._id}?page=-1`) // Invalid page
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"page" must be greater than or equal to 1')
    })

    it('should respond with Bad Request if limit is a string', async () => {
      const response = await request(app)
        .get(`/reviews/${shelters[0]._id}?limit=limit`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"limit" must be a number')
    })

    it('should respond with Bad Request if page is a string', async () => {
      const response = await request(app)
        .get(`/reviews/${shelters[0]._id}?page=page`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(400)

      expect(response.text).toEqual('"page" must be a number')
    })
  })

  describe('update review', () => {
    let user: User, shelters, shelterID, body: ReviewPayload

    beforeEach(async () => {
      user = await generateUserandTokens()
      await generateShelters()
      shelters = await UserModel.find({ role: 'SHELTER' })
      shelterID = shelters[0]._id
      await generateReview(shelterID)
      body = {
        rating: 4,
        reviewText: 'Good shelter!'
      }
    })

    afterEach(async () => {
      await removeAllUsers()
      jest.restoreAllMocks()
    })

    it('should successfully update the review', async () => {
      const originalShelter = await UserModel.findOne(shelters[0]._id)
      if (!originalShelter) throw { code: 404, message: 'Shelter not found' }

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(200)

      expect(response.body.message).toBe('Review updated successfully')
      // Check if the shelter rating has been updated
      const updatedShelter = await UserModel.findOne(shelters[0]._id)
      const newRating =
        (originalShelter.rating * originalShelter.numberOfReviews -
          originalShelter.rating +
          body.rating) /
        originalShelter.numberOfReviews

      expect(updatedShelter?.rating).toBeCloseTo(newRating)
      expect(updatedShelter?.numberOfReviews).toBe(
        originalShelter.numberOfReviews
      )
    })

    it('should throw an error if review is not found', async () => {
      await removeAllReviews()

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(404)

      expect(response.text).toBe('Review not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if user is not found', async () => {
      const nonExistentEmailToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(nonExistentEmailToken, { type: 'bearer' })
        .send(body)
        .expect(404)

      expect(response.text).toBe('User not found')
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter tries to update a review', async () => {
      const shelter = await generateAdminandTokens(Role.Shelter)

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(shelter.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(403)

      expect(response.text).toBe('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw an error if admin tries to update a review', async () => {
      const admin = await generateAdminandTokens(Role.Admin)

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(admin.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(403)

      expect(response.text).toBe('Permission denied')
      expect(response.body).toEqual({})
    })

    it('should throw an error if rating is missing', async () => {
      const incompleteBody = {
        shelterID: shelters[0]._id.toString(),
        reviewText: 'Great shelter!'
      }

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(incompleteBody)
        .expect(400)

      expect(response.text).toBe('"rating" is required')
      expect(response.body).toEqual({})
    })

    it('should throw an error if review text is missing', async () => {
      const incompleteBody = {
        shelterID: shelters[0]._id.toString(),
        rating: 5
      }

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(incompleteBody)
        .expect(400)

      expect(response.text).toBe('"reviewText" is required')
      expect(response.body).toEqual({})
    })

    it('should throw an error if rating is empty', async () => {
      body.reviewText = ''

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe('"reviewText" is not allowed to be empty')
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter ID is less than 24 characters long', async () => {
      shelterID = '123456'

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe(
        '"shelterID" length must be 24 characters long'
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if shelter ID is greater than 24 characters long', async () => {
      shelterID = '1234567890123456789012345'

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe(
        '"shelterID" length must be 24 characters long'
      )
      expect(response.body).toEqual({})
    })

    it('should throw an error if rating is less than 1', async () => {
      body.rating = 0

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe('"rating" must be greater than or equal to 1')
      expect(response.body).toEqual({})
    })

    it('should throw an error if rating is greater than 5', async () => {
      body.rating = 6

      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .send(body)
        .expect(400)

      expect(response.text).toBe('"rating" must be less than or equal to 5')
      expect(response.body).toEqual({})
    })

    it('should throw Unauthorized if token is missing', async () => {
      const response = await request(app)
        .put(`/reviews/${shelterID}`)
        .send(body)
        .expect(401)

      expect(response.text).toBe('Unauthorized')
      expect(response.body).toEqual({})
    })
  })
})

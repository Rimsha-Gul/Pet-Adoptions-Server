import { getImageURL } from '../utils/getImageURL'
import { app } from '../app'
import { User, generateUserandTokens } from './utils/generateUserAndToken'
import { dropCollections, dropDatabase, mongooseSetUp } from './utils/setup'
import request from 'supertest'
import { generateAccessToken } from '../utils/generateAccessToken'
import { User as UserMOdel } from '../models/User'

describe('session', () => {
  beforeAll(async () => {
    await mongooseSetUp()
  })

  afterEach(async () => {
    await dropCollections()
  })

  afterAll(async () => {
    await dropDatabase()
  })

  describe('signup', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should return the user session data', async () => {
      user.profilePhoto = ['mockFileID']
      const response = await request(app)
        .get('/session')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(200)

      expect(response.body.name).toEqual(user.name)
      expect(response.body.email).toEqual(user.email)
      expect(response.body.role).toEqual(user.role)
      expect(response.body.address).toEqual(user.address)
      expect(response.body.bio).toEqual(user.bio)

      const expectedProfilePhoto = getImageURL(user.profilePhoto[0])
      expect(response.body.profilePhoto).toEqual(expectedProfilePhoto)
    })

    it('should return an error if the user does not exist', async () => {
      const nonExistentUserToken = generateAccessToken(
        'nonexistent@gmail.com',
        'USER'
      )

      const response = await request(app)
        .get('/session')
        .auth(nonExistentUserToken, { type: 'bearer' })
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should respond with Unauthorized if token is missing', async () => {
      const response = await request(app).get('/session').expect(401)

      expect(response.text).toEqual(`Unauthorized`)
      expect(response.body).toEqual({})
    })

    it('should respond with 403 error if user is not authorized', async () => {
      // Update user's accessToken in the database after it's generated

      await UserMOdel.updateOne(
        { email: user.email },
        { 'tokens.accessToken': 'someInvalidToken' }
      )

      // Now, the token stored in `user.tokens.accessToken` is not valid anymore
      const response = await request(app)
        .get('/session')
        .auth(user.tokens.accessToken, { type: 'bearer' })
        .expect(403)

      expect(response.text).toEqual('User not authorized')
    })
  })
})

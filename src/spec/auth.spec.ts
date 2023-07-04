import { SendCodePayload } from '../models/User'
import { app } from '../app'
import { User, generateUserandTokens } from './utils/generateUserAndToken'
import { mongooseSetUp, dropDatabase, dropCollections } from './utils/setup'
import request from 'supertest'

describe('auth', () => {
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

    it('should respond with user data', async () => {
      const signupData = {
        name: user.name,
        email: 'test1@gmail.com',
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(200)

      expect(response.body.email).toEqual(signupData.email)
    })

    it('should respond with Bad Request if name is missing', async () => {
      const signupData = {
        email: user.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"name" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is missing', async () => {
      const signupData = {
        name: user.name,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is missing', async () => {
      const signupData = {
        name: user.name,
        email: user.email
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"password" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if name is number', async () => {
      const signupData = {
        name: 1,
        email: user.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"name" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is number', async () => {
      const signupData = {
        name: user.name,
        email: 1,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is number', async () => {
      const signupData = {
        name: user.name,
        email: user.email,
        password: 1
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"password" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is invalid', async () => {
      const signupData = {
        name: user.name,
        email: 'test@gmailcom',
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a valid email`)
      expect(response.body).toEqual({})
    })
  })

  describe('sendVerificationCode', () => {
    let user: User
    let payload: SendCodePayload

    beforeEach(async () => {
      user = await generateUserandTokens()
      payload = {
        email: user.email,
        emailChangeRequest: false
      }
    })

    it('should send verification code successfully', async () => {
      const response = await request(app)
        .post('/auth/sendVerificationCode')
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual('Signup email sent successfully')
    })

    it('should fail when email is not found', async () => {
      payload.email = 'nonexistent@gmail.com'

      const response = await request(app)
        .post('/auth/sendVerificationCode')
        .send(payload)
        .expect(404)

      expect(response.text).toEqual('User not found')
    })

    it('should fail when user request is invalid', async () => {
      payload.emailChangeRequest = true

      const response = await request(app)
        .post('/auth/sendVerificationCode')
        .send(payload)
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })

    it('should successfully send an email change request', async () => {
      payload.emailChangeRequest = true

      const response = await request(app)
        .post('/auth/sendVerificationCode')
        .set('Authorization', `bearer ${user.tokens.accessToken}`)
        .send(payload)
        .expect(200)

      expect(response.body.message).toEqual(
        'Email change request sent successfully'
      )
    })
  })

  describe('login', () => {
    let user: User

    beforeEach(async () => {
      user = await generateUserandTokens()
    })

    it('should respond with tokens', async () => {
      const loginData = {
        email: user.email,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
    })

    it('should respond with Bad Request if email is missing', async () => {
      const loginData = {
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"email" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is missing', async () => {
      const loginData = {
        email: user.email
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"password" is required`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is number', async () => {
      const loginData = {
        email: 1,
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if password is number', async () => {
      const loginData = {
        email: user.email,
        password: 1
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"password" must be a string`)
      expect(response.body).toEqual({})
    })

    it('should respond with Bad Request if email is invalid', async () => {
      const loginData = {
        email: 'test@gmailcom',
        password: '123456'
      }
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.text).toEqual(`"email" must be a valid email`)
      expect(response.body).toEqual({})
    })
  })

  describe('logout', () => {
    it('should respond with Unauthorized if token is missing', async () => {
      const response = await request(app).delete(`/auth/logout`).expect(401)

      expect(response.text).toEqual(`Unauthorized`)
      expect(response.body).toEqual({})
    })
  })
})

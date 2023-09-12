import { Role, User } from '../models/User'
import { Delete, Get, Post, Route, Tags } from 'tsoa'
import { generateAccessToken } from '../utils/generateAccessToken'
import { generateRefreshToken } from '../utils/generateRefreshToken'
import {
  ActivityNeeds,
  Category,
  Gender,
  LevelOfGrooming,
  Pet
} from '../models/Pet'
import mongoose from 'mongoose'

@Route('test')
@Tags('Test')
export class TestController {
  /**
   * @summary Populates db with test data
   *
   */
  @Post('/seed')
  public async seedDB() {
    return seedDB()
  }

  /**
   * @summary Clears db of test data
   *
   */
  @Delete('/clear')
  public async clearDB() {
    return clearDB()
  }

  /**
   * @summary Returns reset token
   *
   */
  @Get('/getResetToken')
  public async getResetToken() {
    return getResetToken()
  }

  /**
   * @summary Populates db with test pets data
   *
   */
  @Post('/seedPets')
  public async seedPetsDB() {
    return seedPetsDB()
  }
}

const seedDB = async () => {
  try {
    await User.deleteMany({})

    const oneMinuteAgo = new Date(Date.now() - 60000) // 60000 milliseconds = 1 minute

    const dummyAccessToken = generateAccessToken(
      'test-user@example.com',
      Role.User
    )

    const dummyRefreshToken = generateRefreshToken(
      'test-user@example.com',
      Role.User
    )

    await User.create([
      {
        role: Role.User,
        name: 'Test User',
        email: 'test-user@example.com',
        address: '123 Main St',
        bio: 'I love pets',
        profilePhoto: ['url_to_photo1'],
        password: User.hashPassword('123456'),
        isVerified: true,
        verificationCode: {
          code: '123456',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        tokens: {
          accessToken: dummyAccessToken,
          refreshToken: dummyRefreshToken
        }
      },
      {
        role: Role.User,
        name: 'Unverified User',
        email: 'test-unverified-user@example.com',
        password: User.hashPassword('123456'),
        isVerified: false,
        verificationCode: {
          code: '123456',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        role: Role.User,
        name: 'Expired Code User',
        email: 'test-expired-code-user@example.com',
        password: User.hashPassword('123456'),
        isVerified: false,
        verificationCode: {
          code: '123456',
          createdAt: oneMinuteAgo,
          updatedAt: oneMinuteAgo
        }
      }
    ])
    return { code: 200, message: 'Database seeded!' }
  } catch (error) {
    throw { code: 500, message: 'Failed to seed database' }
  }
}

const clearDB = async () => {
  try {
    await User.deleteMany({})

    return { code: 200, message: 'Database cleared!' }
  } catch (error) {
    throw { code: 500, message: 'Failed to clear database' }
  }
}

const getResetToken = async () => {
  try {
    // Find the user in the database
    const user = await User.findOne({ email: 'test-user@example.com' })
    if (!user) {
      throw { code: 404, message: 'User not found' }
    }

    // Get the reset token from the user document
    const resetToken = user.passwordResetToken
    if (!resetToken) {
      throw { code: 404, message: 'No reset token found for this user' }
    }

    // Return the reset token
    return { code: 200, resetToken: resetToken }
  } catch (error) {
    throw { code: 500, message: 'Failed to fetch token' }
  }
}

const seedPetsDB = async () => {
  try {
    await Pet.deleteMany({})

    await Pet.create([
      {
        shelterID: new mongoose.Types.ObjectId(),
        shelterName: 'Test Shelter 1',
        microchipID: 'A123456789',
        name: 'Fluffy',
        gender: Gender.Female,
        birthDate: new Date(2020, 5, 1),
        color: 'White',
        breed: 'Persian Cat',
        category: Category.Cat,
        activityNeeds: ActivityNeeds.Low,
        levelOfGrooming: LevelOfGrooming.High,
        isHouseTrained: true,
        healthInfo: {
          healthCheck: true,
          allergiesTreated: true,
          wormed: true,
          heartwormTreated: true,
          vaccinated: true,
          deSexed: true
        },
        bio: 'Very friendly',
        traits: ['calm', 'playful'],
        adoptionFee: 200,
        images: ['testImage1.jpg']
      },
      {
        shelterID: new mongoose.Types.ObjectId(),
        shelterName: 'Test Shelter 2',
        microchipID: 'B123456789',
        name: 'Rover',
        gender: Gender.Male,
        birthDate: new Date(2018, 11, 1),
        color: 'Brown',
        breed: 'Golden Retriever',
        category: Category.Dog,
        activityNeeds: ActivityNeeds.High,
        levelOfGrooming: LevelOfGrooming.Medium,
        isHouseTrained: true,
        healthInfo: {
          healthCheck: true,
          allergiesTreated: false,
          wormed: true,
          heartwormTreated: true,
          vaccinated: true,
          deSexed: false
        },
        bio: 'Needs space to run',
        traits: ['energetic', 'friendly'],
        adoptionFee: '250 USD',
        images: ['testImage2.jpg']
      }
    ])
  } catch (error) {
    console.log(error)
    throw { code: 500, message: 'Failed to seed database' }
  }
}

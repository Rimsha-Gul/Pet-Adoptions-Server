import { Role, User } from '../models/User'
import { Delete, Get, Post, Route, Tags } from 'tsoa'
import { generateAccessToken } from '../utils/generateAccessToken'
import { generateRefreshToken } from '../utils/generateRefreshToken'

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
    return { code: 500, message: 'Failed to seed database' }
  }
}

const clearDB = async () => {
  try {
    await User.deleteMany({})

    return { code: 200, message: 'Database cleared!' }
  } catch (error) {
    return { code: 500, message: 'Failed to clear database' }
  }
}

const getResetToken = async () => {
  try {
    // Find the user in the database
    const user = await User.findOne({ email: 'test-user@example.com' })
    if (!user) {
      return { code: 404, message: 'User not found' }
    }

    // Get the reset token from the user document
    const resetToken = user.passwordResetToken
    if (!resetToken) {
      return { code: 404, message: 'No reset token found for this user' }
    }

    // Return the reset token
    return { code: 200, resetToken: resetToken }
  } catch (error) {
    return { code: 500, message: 'Failed to fetch token' }
  }
}

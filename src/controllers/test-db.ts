import { Role, User } from '../models/User'
import { Delete, Post, Route, Tags } from 'tsoa'

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
}

const seedDB = async () => {
  try {
    await User.deleteMany({})

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
          accessToken: 'dummy_access_token',
          refreshToken: 'dummy_refresh_token'
        }
      },
      {
        role: Role.User,
        name: 'Unverified User',
        email: 'test-unverified-user@example.com',
        password: User.hashPassword('123456'),
        isVerified: false
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

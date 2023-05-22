import User, {
  LoginPayload,
  SignupResponse,
  UserPayload,
  TokenResponse,
  VerificationResponse,
  VerificationPayload,
  SendCodePayload
} from '../models/User'
import { generateAccessToken } from '../utils/generateAccessToken'
import { generateRefreshToken } from '../utils/generateRefreshToken'
import { removeTokensInDB } from '../utils/removeTokensInDB'
import { UserRequest } from '../types/Request'
import {
  Body,
  Delete,
  Example,
  Post,
  Request,
  Route,
  Security,
  Tags
} from 'tsoa'
import { RequestUser } from '../types/RequestUser'
import { sendSignupEmail } from '../middleware/sendSignUpEmail'
import { generateVerificationCode } from '../utils/generateVerificationCode'

@Route('auth')
@Tags('Auth')
export class AuthController {
  /**
   * @summary Accepts user info, creates user and returns user info along JWT tokens
   *
   */
  @Example<SignupResponse>({
    username: 'John Doe',
    email: 'johndoe@example.com',
    address: '123 Main St'
  })
  @Post('/signup')
  public async signup(@Body() body: UserPayload): Promise<SignupResponse> {
    return signup(body)
  }

  /**
   * @summary Generates a 6-digit code and sends it
   *
   */
  @Post('/sendVerificationCode')
  public async sendVerificationCode(@Body() body: SendCodePayload) {
    return sendVerificationCode(body)
  }

  /**
   * @summary Accepts a 6-digit code from user, verifies the code in db
   *
   */
  @Example<VerificationResponse>({
    isVerified: true,
    tokens: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  })
  @Post('/verifyEmail')
  public async verifyEmail(
    @Body() body: VerificationPayload
  ): Promise<VerificationResponse> {
    return verifyEmail(body)
  }

  /**
   * @summary Verifies the user's email and password and returns JWT tokens
   */
  @Example<TokenResponse>({
    tokens: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  })
  @Post('/login')
  public async login(@Body() body: LoginPayload): Promise<TokenResponse> {
    return login(body)
  }

  /**
   * @summary Removes JWT tokens and returns success message
   */
  @Security('bearerAuth')
  @Delete('/logout')
  public async logout(@Request() req: UserRequest) {
    return logout(req)
  }
}

const signup = async (body: UserPayload): Promise<SignupResponse> => {
  // existing user check
  // hashed password
  // user creation
  // token generation
  const { username, email, address, password } = body
  const existingUser = await User.findOne({ email })

  if (existingUser) {
    throw 'User already exists.'
  }

  const user = new User({
    username: username,
    email: email,
    address: address
  })
  user.password = User.hashPassword(password)
  await user.save()

  // const verificationCode: string = generateVerificationCode()
  // try {
  //   await sendSignupEmail(verificationCode, user.email)
  //   console.log('Signup email sent successfully')
  // } catch (error) {
  //   console.error('Error sending signup email:', error)
  // }
  // user.verificationCode = verificationCode

  await user.save()
  return {
    username: user.username,
    email: user.email,
    address: user.address
  }
}

const sendVerificationCode = async (body: SendCodePayload) => {
  console.log(body)
  const { email } = body
  const user = await User.findOne({ email })
  if (!user) throw 'User not found'
  const verificationCode: string = generateVerificationCode()
  try {
    console.log(email)
    await sendSignupEmail(verificationCode, user.email)
    if (user.verificationCode.code) {
      user.verificationCode = {
        code: verificationCode,
        createdAt: user.verificationCode.createdAt,
        updatedAt: new Date()
      }
    } else {
      user.verificationCode = {
        code: verificationCode,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    await user.save()
    return 'Signup email sent successfully'
  } catch (error) {
    throw 'Error sending signup email'
  }
}

const verifyEmail = async (
  body: VerificationPayload
): Promise<VerificationResponse> => {
  const { email, verificationCode } = body
  const user = await User.findOne({ email })
  if (!user) {
    throw 'User not found'
  }

  const currentTimestamp = Date.now()
  const userUpdationTimestamp = user.get('updatedAt').getTime()
  const timeDifference = currentTimestamp - userUpdationTimestamp
  console.log(timeDifference)
  if (timeDifference > 60000) {
    throw 'Verification code expired'
  }

  if (verificationCode === user.verificationCode.code) {
    user.isVerified = true
    const accessToken = generateAccessToken(user.email)
    const refreshToken = generateRefreshToken(user.email)
    user.tokens = {
      accessToken: accessToken,
      refreshToken: refreshToken
    }
  }
  await user.save()
  return {
    isVerified: user.isVerified,
    tokens: user.tokens
  }
}

const login = async (body: LoginPayload): Promise<TokenResponse> => {
  const { email, password } = body

  const user = await User.findOne({ email })
  if (!user) {
    throw 'User not found'
  }

  const isCorrectPassword = user.comparePassword(password)
  if (!isCorrectPassword) {
    throw { code: 403, message: 'Invalid credentials' }
  }

  if (!user.isVerified) {
    // const verificationCode: string = generateVerificationCode()
    // try {
    //   await sendSignupEmail(verificationCode, user.email)
    //   console.log('Signup email sent successfully')
    //   user.verificationCode = verificationCode
    //   await user.save()
    // } catch (error) {
    //   throw 'Error sending signup email'
    // }
    throw 'User not verified'
  } else {
    // if user is verified, generate the tokens
    const accessToken = generateAccessToken(user.email)
    const refreshToken = generateRefreshToken(user.email)

    user.tokens = {
      accessToken: accessToken,
      refreshToken: refreshToken
    }
    await user.save()
    return { tokens: user.tokens }
  }
}

const logout = async (req: UserRequest) => {
  await removeTokensInDB((req.user as RequestUser).email)
  return 'Logout successful'
}

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
import { sendEmail } from '../middleware/sendEmail'
import { generateVerificationCode } from '../utils/generateVerificationCode'
import { getVerificationCodeEmail } from '../data/emailMessages'

@Route('auth')
@Tags('Auth')
export class AuthController {
  /**
   * @summary Accepts user info, creates user and returns user info except password
   *
   */
  @Example<SignupResponse>({
    name: 'John Doe',
    email: 'johndoe@example.com'
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
  const { name, email, password } = body
  const existingUser = await User.findOne({ email })

  if (existingUser) {
    throw { code: 409, message: 'User already exists.' }
  }

  const user = new User({
    name: name,
    email: email
  })
  user.password = User.hashPassword(password)
  await user.save()

  return {
    name: user.name,
    email: user.email
  }
}

const sendVerificationCode = async (body: SendCodePayload) => {
  console.log(body)
  const { email } = body
  const user = await User.findOne({ email })
  if (!user) throw { code: 404, message: 'User not found' }
  const verificationCode: string = generateVerificationCode()
  try {
    const email = getVerificationCodeEmail(verificationCode)
    await sendEmail(user.email, email.subject, email.message)
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
    return { code: 200, message: 'Signup email sent successfully' }
  } catch (error) {
    throw { code: 500, message: 'Error sending signup email' }
  }
}

const verifyEmail = async (
  body: VerificationPayload
): Promise<VerificationResponse> => {
  const { email, verificationCode } = body
  const user = await User.findOne({ email })
  if (!user) throw { code: 404, message: 'User not found' }

  if (verificationCode === user.verificationCode.code) {
    const currentTimestamp = Date.now()
    const userUpdationTimestamp = user.verificationCode.updatedAt.getTime()
    const timeDifference = currentTimestamp - userUpdationTimestamp
    console.log(timeDifference)
    if (timeDifference > 60000) {
      throw { code: 401, message: 'Verification code expired' }
    }
    user.isVerified = true
    const accessToken = generateAccessToken(user.email, user.role)
    const refreshToken = generateRefreshToken(user.email, user.role)
    user.tokens = {
      accessToken: accessToken,
      refreshToken: refreshToken
    }
  } else {
    throw { code: 400, message: 'Incorrect verification code' }
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
  if (!user) throw { code: 404, message: 'User not found' }

  const isCorrectPassword = user.comparePassword(password)
  if (!isCorrectPassword) {
    throw { code: 401, message: 'Invalid credentials' }
  }

  if (!user.isVerified) {
    throw { code: 403, message: 'User not verified' }
  } else {
    // if user is verified, generate the tokens
    const accessToken = generateAccessToken(user.email, user.role)
    const refreshToken = generateRefreshToken(user.email, user.role)

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
  return { code: 200, message: 'Logout successful' }
}

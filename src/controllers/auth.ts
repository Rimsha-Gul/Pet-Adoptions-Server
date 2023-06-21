import User, {
  LoginPayload,
  SignupResponse,
  UserPayload,
  TokenResponse,
  VerificationResponse,
  VerificationPayload,
  SendCodePayload,
  ShelterResponse,
  ChangeEmailPayload
} from '../models/User'
import { generateAccessToken } from '../utils/generateAccessToken'
import { generateRefreshToken } from '../utils/generateRefreshToken'
import { removeTokensInDB } from '../utils/removeTokensInDB'
import { UserRequest } from '../types/Request'
import {
  Body,
  Delete,
  Example,
  Get,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags
} from 'tsoa'
import { RequestUser } from '../types/RequestUser'
import { sendEmail } from '../middleware/sendEmail'
import { generateVerificationCode } from '../utils/generateVerificationCode'
import { getVerificationCodeEmail } from '../data/emailMessages'
import {
  changeEmailPayloadExample,
  shelterResponseExample,
  signupResponseExample,
  tokenResponseExample,
  verificationResponseExample
} from '../examples/auth'

@Route('auth')
@Tags('Auth')
export class AuthController {
  /**
   * @summary Accepts user info, creates user and returns user info except password
   *
   */
  @Example<SignupResponse>(signupResponseExample)
  @Post('/signup')
  public async signup(@Body() body: UserPayload): Promise<SignupResponse> {
    return signup(body)
  }

  /**
   * @summary Generates a 6-digit code and sends it
   *
   */
  @Post('/sendVerificationCode')
  public async sendVerificationCode(
    @Body() body: SendCodePayload,
    @Request() req: UserRequest
  ) {
    return sendVerificationCode(body, req)
  }

  /**
   * @summary Accepts a 6-digit code from user, verifies the code in db
   *
   */
  @Example<VerificationResponse>(verificationResponseExample)
  @Post('/verifyEmail')
  public async verifyEmail(
    @Body() body: VerificationPayload
  ): Promise<VerificationResponse> {
    return verifyEmail(body)
  }

  /**
   * @summary Verifies the user's email and password and returns JWT tokens
   */
  @Example<TokenResponse>(tokenResponseExample)
  @Post('/login')
  public async login(@Body() body: LoginPayload): Promise<TokenResponse> {
    return login(body)
  }

  /**
   * @summary Refreshes access token
   */
  @Example<TokenResponse>(tokenResponseExample)
  @Security('bearerAuth')
  @Post('/refresh')
  public async refresh(@Request() req: UserRequest): Promise<TokenResponse> {
    return refresh(req)
  }

  /**
   * @summary Changes user's email
   */
  @Example<ChangeEmailPayload>(changeEmailPayloadExample)
  @Security('bearerAuth')
  @Put('changeEmail')
  public async changeEmail(
    @Body() body: ChangeEmailPayload,
    @Request() req: UserRequest
  ) {
    return changeEmail(body, req)
  }

  /**
   * @summary Removes JWT tokens and returns success message
   */
  @Security('bearerAuth')
  @Delete('/logout')
  public async logout(@Request() req: UserRequest) {
    return logout(req)
  }

  /**
   * @summary Returns ids and names of all shelters
   *
   */
  @Example<ShelterResponse>(shelterResponseExample)
  @Security('bearerAuth')
  @Get('/shelters')
  public async getShelters(
    @Request() req: UserRequest
  ): Promise<ShelterResponse[]> {
    return getShelters(req)
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

const sendVerificationCode = async (
  body: SendCodePayload,
  req: UserRequest
) => {
  console.log(body)
  const { email, emailChangeRequest } = body
  let user
  if (!emailChangeRequest) {
    user = await User.findOne({ email })
    if (!user) throw { code: 404, message: 'User not found' }
  } else {
    if (!req.user || !req.user.email || !req.user.role) {
      throw { code: 400, message: 'Invalid user data' }
    }
    user = await User.findOne({ email: req.user.email })
    if (!user) throw { code: 404, message: 'User not found' }
  }
  const verificationCode: string = generateVerificationCode()
  try {
    const codeEmail = getVerificationCodeEmail(verificationCode)
    console.log('Simple email: ', email)
    console.log('Saved user email: ', user.email)
    await sendEmail(
      emailChangeRequest ? email : user.email,
      codeEmail.subject,
      codeEmail.message
    )
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

const refresh = async (req: UserRequest): Promise<TokenResponse> => {
  if (!req.user || !req.user.email || !req.user.role) {
    throw { code: 400, message: 'Invalid user data' }
  }
  const user = await User.findOne({ email: req.user.email })

  if (!user) {
    throw { code: 404, message: 'User not found' }
  }
  if (!user.isVerified) {
    console.log('not verified')
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
    console.log('New tokens:', user.tokens)
    return { tokens: user.tokens }
  }
}

const changeEmail = async (body: ChangeEmailPayload, req: UserRequest) => {
  if (!req.user || !req.user.email || !req.user.role) {
    throw { code: 400, message: 'Invalid user data' }
  }
  const user = await User.findOne({ email: req.user.email })

  if (!user) {
    throw { code: 404, message: 'User not found' }
  }
  if (!user.isVerified) {
    console.log('not verified')
    throw { code: 403, message: 'User not verified' }
  } else {
    // if user is verified, change the email
    const { email } = body
    user.email = email
    await user.save()
    return { code: 200, message: 'Email changed successfully' }
  }
}

const logout = async (req: UserRequest) => {
  await removeTokensInDB((req.user as RequestUser).email)
  return { code: 200, message: 'Logout successful' }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getShelters = async (_req: UserRequest): Promise<ShelterResponse[]> => {
  try {
    const shelters = await User.find({ role: 'SHELTER' }, '_id name')
    const shelterResponses: ShelterResponse[] = shelters.map((shelter) => ({
      id: shelter._id.toString(),
      name: shelter.name
    }))
    return shelterResponses
  } catch (error: any) {
    throw { code: 500, message: 'Failed to fetch shelters' }
  }
}

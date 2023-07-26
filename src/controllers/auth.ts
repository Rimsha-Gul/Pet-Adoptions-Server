import User, {
  LoginPayload,
  SignupResponse,
  UserPayload,
  TokenResponse,
  VerificationResponse,
  VerificationPayload,
  SendCodePayload,
  ShelterResponse,
  EmailPayload,
  CheckPasswordPayload,
  UpdateProfilePayload
} from '../models/User'
import { generateAccessToken } from '../utils/generateAccessToken'
import { generateRefreshToken } from '../utils/generateRefreshToken'
import { removeTokensInDB } from '../utils/removeTokensInDB'
import { UserRequest } from '../types/Request'
import {
  Body,
  Delete,
  Example,
  FormField,
  Get,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
  UploadedFile
} from 'tsoa'
import { RequestUser } from '../types/RequestUser'
import { sendEmail } from '../middleware/sendEmail'
import { generateVerificationCode } from '../utils/generateVerificationCode'
import { getVerificationCodeEmail } from '../data/emailMessages'
import {
  emailPayloadExample,
  checkPasswordPayloadExample,
  shelterResponseExample,
  signupResponseExample,
  tokenResponseExample,
  updateProfilePayloadExample,
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
   * @summary Updates user's profile
   */
  @Example<UpdateProfilePayload>(updateProfilePayloadExample)
  @Security('bearerAuth')
  @Put('/updateProfile')
  public async updateProfile(
    @Request() req: UserRequest,
    @FormField() name?: string,
    @FormField() address?: string,
    @FormField() bio?: string,
    @UploadedFile() profilePhoto?: string[]
  ) {
    return updateProfile(req, name, address, bio, profilePhoto)
  }

  /**
   * @summary Checks if user's new email already has a linked account
   */
  @Example<EmailPayload>(emailPayloadExample)
  @Security('bearerAuth')
  @Get('/checkEmail')
  public async checkEmail(@Request() req: UserRequest) {
    return checkEmail(req)
  }

  /**
   * @summary Changes user's email
   */
  @Example<EmailPayload>(emailPayloadExample)
  @Security('bearerAuth')
  @Put('/changeEmail')
  public async changeEmail(
    @Body() body: EmailPayload,
    @Request() req: UserRequest
  ): Promise<TokenResponse> {
    return changeEmail(body, req)
  }

  /**
   * @summary Checks if user's entered password is correct
   */
  @Example<CheckPasswordPayload>(checkPasswordPayloadExample)
  @Security('bearerAuth')
  @Post('/checkPassword')
  public async checkPassword(
    @Body() body: CheckPasswordPayload,
    @Request() req: UserRequest
  ) {
    return checkPassword(body, req)
  }

  /**
   * @summary Changes user's password
   */
  @Example<CheckPasswordPayload>(checkPasswordPayloadExample)
  @Security('bearerAuth')
  @Put('/changePassword')
  public async changePassword(
    @Body() body: CheckPasswordPayload,
    @Request() req: UserRequest
  ) {
    return changePassword(body, req)
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
    throw { code: 409, message: 'User already exists' }
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
  const { email, emailChangeRequest } = body
  let user
  if (!emailChangeRequest) {
    user = await User.findOne({ email })
    if (!user) throw { code: 404, message: 'User not found' }
  } else {
    if (req.user) {
      user = await User.findOne({ email: req.user.email })
      if (!user) throw { code: 404, message: 'User not found' }
    }
  }
  const verificationCode: string = generateVerificationCode()
  try {
    const codeEmail = getVerificationCodeEmail(verificationCode)
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
    if (emailChangeRequest)
      return { code: 200, message: 'Email change request sent successfully' }
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = (await User.findOne({ email: req.user?.email }))!

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

const updateProfile = async (
  req: UserRequest,
  name?: string,
  address?: string,
  bio?: string,
  profilePhoto?: string[]
) => {
  const userEmail = req?.user?.email

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = (await User.findOne({ email: userEmail }))!

  if (name) user.name = name
  if (address) user.address = address
  if (bio) user.bio = bio
  if (profilePhoto) {
    user.profilePhoto = profilePhoto
  }

  await user.save()
  return { code: 200, message: 'Profile updated successfully' }
}

const checkEmail = async (req: UserRequest) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = (await User.findOne({ email: req.user?.email }))!

  if (!user.isVerified) {
    throw { code: 403, message: 'User not verified' }
  } else {
    // if user is verified, check if there's already a user with new emmail
    const { email } = req.query
    const existingUser = await User.findOne({ email: email })
    if (existingUser) {
      throw { code: 409, message: 'A user with this email already exists' }
    }
    return { code: 200, message: 'Email is available' }
  }
}

const changeEmail = async (
  body: EmailPayload,
  req: UserRequest
): Promise<TokenResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = (await User.findOne({ email: req?.user?.email }))!

  if (!user.isVerified) {
    throw { code: 403, message: 'User not verified' }
  } else {
    // if user is verified, change the user's email with new emmail
    const { email } = body
    user.email = email
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

const checkPassword = async (body: CheckPasswordPayload, req: UserRequest) => {
  const user = await User.findOne({ email: req?.user?.email })
  if (!user) throw { code: 404, message: 'User not found' }

  if (!user.isVerified) {
    throw { code: 403, message: 'User not verified' }
  } else {
    // if user is verified, check the entered password
    const { password } = body
    const isCorrectPassword = user.comparePassword(password)
    if (!isCorrectPassword) {
      throw { code: 400, message: 'Invalid password' }
    }

    return { code: 200, message: 'Password is correct' }
  }
}

const changePassword = async (body: CheckPasswordPayload, req: UserRequest) => {
  const user = await User.findOne({ email: req?.user?.email })
  if (!user) throw { code: 404, message: 'User not found' }

  if (!user.isVerified) {
    throw { code: 403, message: 'User not verified' }
  } else {
    // if user is verified, change his password
    const { password } = body
    user.password = password
    user.password = User.hashPassword(password)
    await user.save()
    return { code: 200, message: 'Password changed successfully' }
  }
}

const logout = async (req: UserRequest) => {
  await removeTokensInDB((req.user as RequestUser).email)
  return { code: 200, message: 'Logout successful' }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getShelters = async (_req: UserRequest): Promise<ShelterResponse[]> => {
  const shelters = await User.find({ role: 'SHELTER' }, '_id name')
  const shelterResponses: ShelterResponse[] = shelters.map((shelter) => ({
    id: shelter._id.toString(),
    name: shelter.name
  }))
  return shelterResponses
}

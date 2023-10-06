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
  UpdateProfilePayload,
  Role,
  EmailChangeRequest,
  ResetPasswordPayload
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
  Query,
  Request,
  Route,
  Security,
  Tags,
  UploadedFile
} from 'tsoa'
import { RequestUser } from '../types/RequestUser'
import { sendEmail } from '../middleware/sendEmail'
import { generateVerificationCode } from '../utils/generateVerificationCode'
import {
  getResetPasswordEmail,
  getVerificationCodeEmail,
  requestAlternateEmailForShelter
} from '../data/emailMessages'
import {
  emailPayloadExample,
  checkPasswordPayloadExample,
  shelterResponseExample,
  signupResponseExample,
  tokenResponseExample,
  updateProfilePayloadExample,
  verificationResponseExample,
  resetPasswordPayloadExample
} from '../examples/auth'
import { Invitation, InvitationStatus } from '../models/Invitation'
import { generateResetToken } from '../utils/generateResetToken'
import jwt from 'jsonwebtoken'

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
  @Security('bearerAuth')
  @Get('/checkEmail')
  public async checkEmail(
    @Request() req: UserRequest,
    /**
     * New email for user
     * @example "jackdoe@example.com"
     */
    @Query() email: string
  ) {
    return checkEmail(req, email)
  }

  /**
   * @summary Changes user's email
   */
  @Example<TokenResponse>(tokenResponseExample)
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

  /**
   * @summary Checks if user's entered email has an associated account and create reset tokens
   */
  @Example<EmailPayload>(emailPayloadExample)
  @Post('/requestPasswordReset')
  public async requestPasswordReset(@Body() body: EmailPayload) {
    return requestPasswordReset(body)
  }

  /**
   * @summary Verifies the reset password token for user
   *
   */
  @Get('/verifyResetToken')
  public async VerifyResetToken(@Request() req: UserRequest) {
    return VerifyResetToken(req)
  }

  /**
   * @summary Changes user's password
   */
  @Example<ResetPasswordPayload>(resetPasswordPayloadExample)
  @Put('/resetPassword')
  public async resetPassword(@Body() body: ResetPasswordPayload) {
    return resetPassword(body)
  }

  /**
   * @summary Sends email to user to provide alternate email to sign up as shelter
   */
  @Example<EmailPayload>(emailPayloadExample)
  @Security('bearerAuth')
  @Post('/getAlternateEmail')
  public async getAlternateEmail(@Body() body: EmailPayload) {
    return getAlternateEmail(body)
  }
}

const signup = async (body: UserPayload): Promise<SignupResponse> => {
  const { name, email, password, role } = body

  if (role === Role.Admin) {
    const existingAdmin = await User.findOne({ role: Role.Admin })
    if (existingAdmin) throw { code: 409, message: 'Admin user already exists' }
  }
  if (role === Role.Shelter) {
    const invitation = await Invitation.findOne({ shelterEmail: email })
    if (!invitation) throw { code: 400, message: 'Invalid invitation' }

    invitation.status = InvitationStatus.Accepted
    await invitation.save()
  }

  const existingUser = await User.findOne({ email })

  if (existingUser) throw { code: 409, message: 'User already exists' }

  const userPayload = {
    name: name,
    email: email,
    role: role
  }

  // If role is 'Shelter', include rating and numberOfReviews
  if (role === Role.Shelter) {
    userPayload['rating'] = 0
    userPayload['numberOfReviews'] = 0
  }

  const user = new User(userPayload)

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
  if (
    !emailChangeRequest ||
    emailChangeRequest === EmailChangeRequest.currentEmailStep
  ) {
    user = await User.findOne({ email })
    if (!user) throw { code: 404, message: 'User not found' }
  } else {
    if (req.user) {
      user = await User.findOne({ email: req.user.email })
      if (!user) throw { code: 404, message: 'User not found' }
    }
  }

  if (!emailChangeRequest && user.isVerified === true)
    throw { code: 422, message: 'User already verified' } // User is already verified and thus cannot be verified again

  const verificationCode: string = generateVerificationCode()
  try {
    const codeEmail = getVerificationCodeEmail(verificationCode)
    await sendEmail(
      emailChangeRequest === EmailChangeRequest.newEmailStep
        ? email
        : user.email,
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

const checkEmail = async (req: UserRequest, email: string) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = (await User.findOne({ email: req.user?.email }))!

  if (!user.isVerified) {
    throw { code: 403, message: 'User not verified' }
  } else {
    // if user is verified, check if there's already a user with new emmail
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

const requestPasswordReset = async (body: EmailPayload) => {
  const { email } = body

  // Check if there's a user with this email
  const user = await User.findOne({ email })
  if (!user) throw { code: 404, message: 'User not found' }

  // Generate a unique token and associate it with the user
  const resetToken = generateResetToken(email)
  user.passwordResetToken = resetToken

  await user.save()

  // Create the reset password email content.
  const resetEmail = getResetPasswordEmail(resetToken)

  // Send the email
  try {
    await sendEmail(user.email, resetEmail.subject, resetEmail.message)
  } catch (error) {
    throw { code: 500, message: 'Error sending reset password email' }
  }

  return { code: 200, message: 'Reset password email sent successfully' }
}

const VerifyResetToken = async (req: UserRequest) => {
  const { resetToken } = req.query

  try {
    // decode and verify the token synchronously
    const decoded: any = jwt.verify(
      resetToken as string,
      process.env.RESET_TOKEN_SECRET || ''
    )

    const { email } = decoded

    // Check if a user with the given email exists
    const existingUser = await User.findOne({ email })
    if (!existingUser) throw { code: 404, message: 'User not found' }

    // Verify the reset token
    if (
      !existingUser.passwordResetToken ||
      existingUser.passwordResetToken !== resetToken
    ) {
      throw { code: 400, message: 'Invalid or expired reset token' }
    }

    return { email }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw { code: 400, message: 'Expired reset token' }
    }
    if (err.name === 'JsonWebTokenError') {
      throw { code: 400, message: 'Invalid reset token' }
    }
    if (err.code) {
      throw err
    }
    throw { code: 500, message: 'Internal server error' }
  }
}

const resetPassword = async (body: ResetPasswordPayload) => {
  const { email, newPassword } = body

  try {
    // Find the user with the given email
    const user = await User.findOne({ email })
    if (!user) throw { code: 404, message: 'User not found' }

    if (!user.passwordResetToken) {
      throw { code: 404, message: 'No password reset token found' }
    }

    // Check if the password reset token is still valid
    try {
      jwt.verify(user.passwordResetToken, process.env.RESET_TOKEN_SECRET || '')
    } catch (err) {
      throw { code: 400, message: 'Invalid or expired reset token.' }
    }

    // Reset the user's password
    user.password = User.hashPassword(newPassword)
    // Reset the password reset token
    user.passwordResetToken = undefined

    // Save the user
    await user.save()

    return { code: 200, message: 'Password reset successfully' }
  } catch (err) {
    if (err.code) {
      throw err
    }
    throw { code: 500, message: 'Internal server error' }
  }
}

const getAlternateEmail = async (body: EmailPayload) => {
  const { email } = body

  const existingUser = await User.findOne({ email })

  if (!existingUser) throw { code: 404, message: 'User not found' }

  if (existingUser.role === Role.Shelter)
    throw { code: 409, message: 'User is already a shelter' }

  const { subject, message } = requestAlternateEmailForShelter(
    existingUser.name
  )

  await sendEmail(email, subject, message)

  return { code: 200, message: 'User notified successfully' }
}

import bcrypt from 'bcrypt'
import User, {
  LoginPayload,
  SignupResponse,
  UserPayload,
  TokenResponse
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

@Route('auth')
@Tags('Auth')
export class AuthController {
  /**
   * @summary Accepts user info, creates user and returns user info along JWT tokens
   *
   */
  @Example<SignupResponse>({
    name: 'John Doe',
    email: 'johndoe@example.com',
    address: '123 Main St',
    tokens: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  })
  @Post('/signup')
  public async signup(@Body() body: UserPayload): Promise<SignupResponse> {
    return signup(body)
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
  public async login(@Body() req: LoginPayload): Promise<TokenResponse> {
    return login(req)
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
  const { name, email, address, password } = body

  const existingUser = await User.findOne({ email })

  if (existingUser) {
    throw 'User already exists.'
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = new User({
    name: name,
    email: email,
    address: address,
    password: hashedPassword
  })
  await user.save()
  const accessToken = generateAccessToken(user.email)
  const refreshToken = generateRefreshToken(user.email)
  user.tokens = {
    accessToken: accessToken,
    refreshToken: refreshToken
  }
  await user.save()
  return {
    name: user.name,
    email: user.email,
    address: user.address,
    tokens: user.tokens
  }
}

const login = async (body: LoginPayload): Promise<TokenResponse> => {
  const { email, password } = body

  const user = await User.findOne({ email })
  if (!user) {
    throw 'User not found'
  }

  const expectedPassword = await bcrypt.compare(password, user.password)
  if (!expectedPassword) {
    throw 'Invalid credentials'
  }

  const accessToken = generateAccessToken(user.email)
  const refreshToken = generateRefreshToken(user.email)

  user.tokens = {
    accessToken: accessToken,
    refreshToken: refreshToken
  }
  await user.save()
  return { tokens: user.tokens }
}

const logout = async (req: UserRequest) => {
  await removeTokensInDB(req.user!.email)
  return 'Logout successful'
}

import { generateAccessToken } from '../../utils/generateAccessToken'
import { Role, User as UserModel } from '../../models/User'
import { generateRefreshToken } from '../../utils/generateRefreshToken'
import { generateVerificationCode } from '../../utils/generateVerificationCode'
import { generateResetToken } from '../../utils/generateResetToken'

export interface User {
  role: Role
  name: string
  email: string
  password: string
  tokens: { accessToken: string; refreshToken: string }
  isVerified: boolean
  verificationCode: {
    code?: string
    createdAt?: Date
    updatedAt?: Date
  }
  address?: string
  bio?: string
  profilePhoto?: string[]
  passwordResetToken?: string
}

export interface Admin {
  name: string
  email: string
  password: string
  tokens: { accessToken: string; refreshToken: string }
  isVerified: boolean
}

export const generateUserandTokens = async (): Promise<User> => {
  const password = UserModel.hashPassword('123456')
  const user = new UserModel({
    role: Role.User,
    name: 'Test User',
    email: 'test@gmail.com',
    password: password
  })
  const savedUser = await user.save()
  const accessToken = generateAccessToken(user.email, user.role)
  const refreshToken = generateRefreshToken(user.email, user.role)

  const savedUserWithTokens = await UserModel.findOneAndUpdate(
    {
      email: savedUser.email
    },
    {
      $set: {
        isVerified: true,
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken
        },
        profilePhoto: ['mockFileID']
      }
    },
    { new: true }
  )
  const verificationCode: string = generateVerificationCode()
  let savedUserWithTokensAndCode
  if (savedUserWithTokens) {
    savedUserWithTokensAndCode = await UserModel.findOneAndUpdate(
      {
        email: savedUser.email
      },
      {
        $set: {
          isVerified: true,
          verificationCode: {
            code: verificationCode,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    )
  }
  user.passwordResetToken = generateResetToken(user.email)
  await user.save()

  return {
    tokens: {
      accessToken: savedUserWithTokens
        ? savedUserWithTokens.tokens.accessToken
        : ' ',
      refreshToken: savedUserWithTokens
        ? savedUserWithTokens.tokens.refreshToken
        : ' '
    },
    role: user.role,
    name: user.name,
    email: user.email,
    password: user.password,
    isVerified: true,
    verificationCode: {
      code: savedUserWithTokensAndCode.verificationCode.code,
      createdAt: savedUserWithTokensAndCode.verificationCode.createdAt,
      updatedAt: savedUserWithTokensAndCode.verificationCode.updatedAt
    },
    profilePhoto: user.profilePhoto,
    passwordResetToken: user.passwordResetToken
  }
}

export const generateUserNotVerifiedandTokens = async (): Promise<User> => {
  const password = UserModel.hashPassword('123456')
  const user = new UserModel({
    role: Role.User,
    name: 'Test User',
    email: 'unverifiedtest@gmail.com',
    password: password
  })
  const savedUser = await user.save()
  const accessToken = generateAccessToken(user.email, user.role)
  const refreshToken = generateRefreshToken(user.email, user.role)

  const savedUserWithTokens = await UserModel.findOneAndUpdate(
    {
      email: savedUser.email
    },
    {
      $set: {
        isVerified: false,
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      }
    },
    { new: true }
  )

  await user.save()

  return {
    tokens: {
      accessToken: savedUserWithTokens
        ? savedUserWithTokens.tokens.accessToken
        : ' ',
      refreshToken: savedUserWithTokens
        ? savedUserWithTokens.tokens.refreshToken
        : ' '
    },
    role: user.role,
    name: user.name,
    email: user.email,
    password: user.password,
    isVerified: false,
    verificationCode: {}
  }
}

export const generateAdminandTokens = async (role: Role): Promise<Admin> => {
  const password = UserModel.hashPassword('123456')
  const user = new UserModel({
    role: role,
    name: role === Role.Admin ? 'Admin Test User' : 'Shelter Test User',
    email: role === Role.Admin ? 'admintest@gmail.com' : 'shelter1@test.com',
    password: password
  })
  const savedUser = await user.save()
  const accessToken = generateAccessToken(user.email, user.role)
  const refreshToken = generateRefreshToken(user.email, user.role)

  const savedUserWithTokens = await UserModel.findOneAndUpdate(
    {
      email: savedUser.email
    },
    {
      $set: {
        isVerified: true,
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      }
    },
    { new: true }
  )

  await user.save()

  return {
    tokens: {
      accessToken: savedUserWithTokens
        ? savedUserWithTokens.tokens.accessToken
        : ' ',
      refreshToken: savedUserWithTokens
        ? savedUserWithTokens.tokens.refreshToken
        : ' '
    },
    name: user.name,
    email: user.email,
    password: user.password,
    isVerified: true
  }
}

export const removeAllUsers = async (role?: Role) => {
  if (role !== undefined) {
    await UserModel.deleteMany({ role: role })
  } else {
    await UserModel.deleteMany({})
  }
}

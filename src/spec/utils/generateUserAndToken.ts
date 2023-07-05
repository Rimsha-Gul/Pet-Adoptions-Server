import { generateAccessToken } from '../../utils/generateAccessToken'
import { Role, User as UserModel } from '../../models/User'
import { generateRefreshToken } from '../../utils/generateRefreshToken'
import { generateVerificationCode } from '../../utils/generateVerificationCode'

export interface User {
  name: string
  email: string
  password: string
  tokens: { accessToken: string; refreshToken: string }
  isVerified: boolean
  verificationCode: {
    code: string
    createdAt: Date
    updatedAt: Date
  }
  address?: string
  bio?: string
  profilePhoto?: string[]
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
        }
      }
    },
    { new: true }
  )
  const verificationCode: string = generateVerificationCode()
  let savedUserWithTokensAndCode
  if (savedUserWithTokens) {
    if (savedUserWithTokens.verificationCode.code) {
      savedUserWithTokensAndCode = await UserModel.findOneAndUpdate(
        {
          email: savedUser.email
        },
        {
          $set: {
            isVerified: true,
            verificationCode: {
              code: verificationCode,
              createdAt: user.verificationCode.createdAt,
              updatedAt: new Date()
            }
          }
        },
        { new: true }
      )
    } else {
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
  }
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
    isVerified: true,
    verificationCode: {
      code: savedUserWithTokensAndCode.verificationCode.code,
      createdAt: savedUserWithTokensAndCode.verificationCode.createdAt,
      updatedAt: savedUserWithTokensAndCode.verificationCode.updatedAt
    }
  }
}

export const generateUserNotVerifiedandTokens = async (): Promise<User> => {
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
        isVerified: false,
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      }
    },
    { new: true }
  )
  const verificationCode: string = generateVerificationCode()
  let savedUserWithTokensAndCode
  if (savedUserWithTokens) {
    if (savedUserWithTokens.verificationCode.code) {
      savedUserWithTokensAndCode = await UserModel.findOneAndUpdate(
        {
          email: savedUser.email
        },
        {
          $set: {
            isVerified: false,
            verificationCode: {
              code: verificationCode,
              createdAt: user.verificationCode.createdAt,
              updatedAt: new Date()
            }
          }
        },
        { new: true }
      )
    } else {
      savedUserWithTokensAndCode = await UserModel.findOneAndUpdate(
        {
          email: savedUser.email
        },
        {
          $set: {
            isVerified: false,
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
  }
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
    isVerified: false,
    verificationCode: {
      code: savedUserWithTokensAndCode.verificationCode.code,
      createdAt: savedUserWithTokensAndCode.verificationCode.createdAt,
      updatedAt: savedUserWithTokensAndCode.verificationCode.updatedAt
    }
  }
}

export const generateAdminandTokens = async (): Promise<Admin> => {
  const password = UserModel.hashPassword('123456')
  const user = new UserModel({
    role: Role.Admin,
    name: 'Admin Test User',
    email: 'admintest@gmail.com',
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

export const removeAllUsers = async () => {
  await UserModel.deleteMany({})
}

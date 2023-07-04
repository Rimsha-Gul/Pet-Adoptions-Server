import { generateAccessToken } from '../../utils/generateAccessToken'
import { Role, User as UserModel } from '../../models/User'
import { generateRefreshToken } from '../../utils/generateRefreshToken'
import { generateVerificationCode } from '../../utils/generateVerificationCode'
import { getVerificationCodeEmail } from '../../data/emailMessages'
import { sendEmail } from '../../middleware/sendEmail'

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
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      }
    },
    { new: true }
  )
  const verificationCode: string = generateVerificationCode()
  const codeEmail = getVerificationCodeEmail(verificationCode)
  await sendEmail(user.email, codeEmail.subject, codeEmail.message)
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
    isVerified: savedUserWithTokensAndCode.isVerified,
    verificationCode: {
      code: savedUserWithTokensAndCode.code,
      createdAt: savedUserWithTokensAndCode.createdAt,
      updatedAt: savedUserWithTokensAndCode.updatedAt
    }
  }
}

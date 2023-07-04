import { RequestHandler, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { verifyTokenInDB } from '../utils/verifyTokenInDB'
import { UserRequest } from '../types/Request'
import { Role } from '../models/User'

export const authenticateAccessToken: RequestHandler = async (
  req,
  res,
  next
) => {
  await authenticateToken(req, res, next, process.env.ACCESS_TOKEN_SECRET || '')
}

export const authenticateRefreshToken: RequestHandler = async (
  req,
  res,
  next
) => {
  console.log('refresh refresh')
  await authenticateToken(
    req,
    res,
    next,
    process.env.REFRESH_TOKEN_SECRET || ''
  )
}

const authenticateToken = async (
  req: UserRequest,
  res: Response,
  next: NextFunction,
  key: string
) => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]
  console.log('token: ', token)
  //console.log('Token early: ', token)
  try {
    req.user = {
      email: 'example@mail.com',
      role: Role.User
    }
    if (!token) {
      console.log('no token: ', token)
      throw { code: 401, message: 'Unauthorized' }
    }
    const data: any = jwt.verify(token, key)

    try {
      const user = await verifyTokenInDB(data?.email, token)
      req.user = user
      return next()
    } catch (error: any) {
      res.status(error.code).send(error.message)
    }
  } catch (error: any) {
    res.status(error.code || 401).send(error.message)
  }
}

import { RequestHandler, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { verifyTokenInDB } from '../utils/verifyTokenInDB'
import { UserRequest } from '../types/Request'

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
  try {
    req.user = {
      email: 'example@mail.com'
    }
    if (!token) throw 'Unauthorized'
    const data: any = jwt.verify(token, key)

    const user = await verifyTokenInDB(data?.email, token)
    if (!user) {
      throw 'Unauthorized'
    }
    req.user = user
    return next()
  } catch (error) {
    res.sendStatus(401)
  }
}

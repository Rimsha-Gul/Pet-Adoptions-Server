import { NextFunction, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { verifyTokenInDB } from '../utils/verifyTokenInDB'
import { UserRequest } from '../types/Request'
import User from '../models/User'
import { Role } from '../models/User'

export const isShelter: RequestHandler = async (req, res, next) => {
  await isUserShelter(req, res, next, process.env.ACCESS_TOKEN_SECRET || '')
}

const isUserShelter = async (
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
    if (!token) throw { code: 401, message: 'Unauthorized' }
    const data: any = jwt.verify(token, key)
    const userEmail = data?.email
    const isUser = await User.findOne({ userEmail })
    if (isUser?.role === Role.Shelter) {
      const user = await verifyTokenInDB(data?.email, token)
      if (!user) throw { code: 404, message: 'User not found' }
      req.user = user
      return next()
    }
  } catch (error) {
    res.sendStatus(401)
  }
}

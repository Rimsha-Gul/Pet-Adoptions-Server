import { NextFunction, RequestHandler, Response } from 'express'
import { UserRequest } from '../types/Request'
import { Role } from '../models/User'

export const isUser: RequestHandler = async (req, res, next) => {
  await isUserUser(req, res, next)
}

const isUserUser = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== Role.User)
      throw { code: 403, message: 'Permission denied' }
    return next()
  } catch (error: any) {
    res.status(error.code).send(error.message)
  }
}

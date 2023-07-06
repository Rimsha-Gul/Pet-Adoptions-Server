import { NextFunction, RequestHandler, Response } from 'express'
import { UserRequest } from '../types/Request'
import { Role } from '../models/User'

export const isShelter: RequestHandler = async (req, res, next) => {
  await isUserShelter(req, res, next)
}

const isUserShelter = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role === Role.User)
      throw { code: 403, message: 'Permission denied' }
    return next()
  } catch (error: any) {
    res.status(error.code).send(error.message)
  }
}

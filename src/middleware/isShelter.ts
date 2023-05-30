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
    console.log(req.user)
    if (req.user?.role !== Role.Shelter)
      throw { code: 403, message: 'Permission denied' }
    return next()
  } catch (error: any) {
    res.status(error.code).send(error.message)
  }
}

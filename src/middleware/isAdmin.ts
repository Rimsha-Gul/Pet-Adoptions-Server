import { NextFunction, RequestHandler, Response } from 'express'
import { UserRequest } from '../types/Request'
import { Role } from '../models/User'

export const isAdmin: RequestHandler = async (req, res, next) => {
  await isUserAdmin(req, res, next)
}

const isUserAdmin = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req.user)
    if (req.user?.role !== Role.Admin)
      throw { code: 403, message: 'Permission denied' }
    return next()
  } catch (error: any) {
    res.status(error.code).send(error.message)
  }
}

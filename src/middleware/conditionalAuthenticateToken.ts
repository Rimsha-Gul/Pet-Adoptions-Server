import { RequestHandler } from 'express'
import { authenticateAccessToken } from './authenticateToken'
import { EmailChangeRequest } from '../models/User'

export const conditionalAuthenticateAccessToken: RequestHandler = (
  req,
  res,
  next
) => {
  if (req.body.emailChangeRequest === EmailChangeRequest.newEmailStep) {
    return authenticateAccessToken(req, res, next)
  } else {
    next()
  }
}

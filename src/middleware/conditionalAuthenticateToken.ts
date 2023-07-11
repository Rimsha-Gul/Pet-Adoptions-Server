import { RequestHandler } from 'express'
import { authenticateAccessToken } from './authenticateToken'

export const conditionalAuthenticateAccessToken: RequestHandler = (
  req,
  res,
  next
) => {
  if (req.body.emailChangeRequest === true) {
    return authenticateAccessToken(req, res, next)
  } else {
    next()
  }
}

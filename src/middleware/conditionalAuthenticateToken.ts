import { RequestHandler } from 'express'
import { authenticateAccessToken } from './authenticateToken'

export const conditionalAuthenticateAccessToken: RequestHandler = (
  req,
  res,
  next
) => {
  if (req.body.emailChangeRequest) {
    return authenticateAccessToken(req, res, next)
  } else {
    next()
  }
}

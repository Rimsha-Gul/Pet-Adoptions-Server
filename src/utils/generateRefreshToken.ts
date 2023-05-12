import jwt from 'jsonwebtoken'

export const generateRefreshToken = (email: string) =>
  jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET || 'default-secret', {
    expiresIn: '1d'
  })

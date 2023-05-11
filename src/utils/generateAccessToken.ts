import jwt from 'jsonwebtoken'

export const generateAccessToken = (email: String) =>
  jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: '1h'
  })

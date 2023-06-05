import jwt from 'jsonwebtoken'

export const generateAccessToken = (email: string, role: string) =>
  jwt.sign(
    { email, role },
    process.env.ACCESS_TOKEN_SECRET || 'default-secret',
    {
      expiresIn: '1h'
    }
  )

import jwt from 'jsonwebtoken'

export const generateRefreshToken = (email: string, role: string) =>
  jwt.sign(
    { email, role },
    process.env.REFRESH_TOKEN_SECRET || 'default-secret',
    {
      expiresIn: '1d'
    }
  )

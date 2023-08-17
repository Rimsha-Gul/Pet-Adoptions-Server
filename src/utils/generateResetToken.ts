import jwt from 'jsonwebtoken'

export const generateResetToken = (email: string) =>
  jwt.sign({ email }, process.env.RESET_TOKEN_SECRET || 'default-secret', {
    expiresIn: '1h'
  })

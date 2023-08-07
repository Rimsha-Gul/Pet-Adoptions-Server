import jwt from 'jsonwebtoken'

export const generateExpiredToken = (email: string) => {
  return jwt.sign(
    { email: email },
    process.env.RESET_TOKEN_SECRET || '',
    { expiresIn: '-10s' } // This creates a JWT that expired 10 seconds ago
  )
}

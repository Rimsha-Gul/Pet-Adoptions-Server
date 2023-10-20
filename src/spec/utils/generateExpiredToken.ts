import jwt from 'jsonwebtoken'

export const generateExpiredToken = (email: string) => {
  return jwt.sign(
    { email: email },
    process.env.RESET_TOKEN_SECRET || 'default-secret',
    { expiresIn: '-10s' } // This creates a JWT that expired 10 seconds ago
  )
}

export const generateExpiredInvitationToken = (email: string) => {
  return jwt.sign(
    { email: email, role: 'SHELTER' },
    process.env.INVITATION_TOKEN_SECRET || 'default-secret',
    { expiresIn: '-10s' } // This creates a JWT that expired 10 seconds ago
  )
}

export const generateExpiredAccessToken = (email: string) => {
  return jwt.sign(
    { email: email, role: 'USER' },
    process.env.ACCESS_TOKEN_SECRET || 'default-secret',
    { expiresIn: '-10s' } // This creates a JWT that expired 1h seconds ago
  )
}

export const generateExpiredRefreshToken = (email: string) => {
  return jwt.sign(
    { email: email, role: 'USER' },
    process.env.REFRESH_TOKEN_SECRET || 'default-secret',
    { expiresIn: '-10s' } // This creates a JWT that expired 1h seconds ago
  )
}

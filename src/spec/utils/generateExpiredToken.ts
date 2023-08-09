import jwt from 'jsonwebtoken'

export const generateExpiredToken = (email: string, type: string) => {
  return jwt.sign(
    { email: email },
    type === 'RESET'
      ? process.env.RESET_TOKEN_SECRET || 'default-secret'
      : process.env.INVITATION_TOKEN_SECRET || 'default-secret',
    { expiresIn: '-10s' } // This creates a JWT that expired 10 seconds ago
  )
}

export const generateExpiredInvitationToken = (email: string) => {
  console.log('henerate expired token')
  return jwt.sign(
    { email: email, role: 'SHELTER' },
    process.env.INVITATION_TOKEN_SECRET || 'default-secret',
    { expiresIn: '-10s' } // This creates a JWT that expired 10 seconds ago
  )
}

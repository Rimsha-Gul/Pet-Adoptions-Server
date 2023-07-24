import jwt from 'jsonwebtoken'

export const generateInvitationToken = (email: string, role: string) =>
  jwt.sign(
    { email, role },
    process.env.INVITATION_TOKEN_SECRET || 'default-secret',
    {
      expiresIn: '1w'
    }
  )

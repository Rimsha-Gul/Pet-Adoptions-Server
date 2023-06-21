import User from '../models/User'

export const verifyTokenInDB = async (email: string, token: string) => {
  const user = await User.findOne({ email })
  if (!user) throw { code: 404, message: 'User not found' }

  let currentTokenObj: any
  if (user.tokens.accessToken === token || user.tokens.refreshToken === token) {
    currentTokenObj = token
  }

  if (!currentTokenObj) throw { code: 403, message: 'User not authorized' }
  else {
    console.log('verified')
    return {
      _id: user._id,
      email: user.email,
      role: user.role
    }
  }
}

import User from '../models/User'

export const verifyTokenInDB = async (email: string, token: string) => {
  const user = await User.findOne({ email })
  if (!user) return undefined

  let currentTokenObj: any
  if (user.tokens.accessToken === token || user.tokens.refreshToken === token) {
    currentTokenObj = token
  }

  if (!currentTokenObj) return undefined
  else {
    return {
      email: user.email
    }
  }
}

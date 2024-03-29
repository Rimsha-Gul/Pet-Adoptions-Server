import User from '../models/User'

export const removeTokensInDB = async (email: string) => {
  const user = (await User.findOne({ email }))!

  user.set('tokens', undefined)
  await user.save()
  return user
}

import User from '../models/User'

export const removeTokensInDB = async (email: string) => {
  const user = await User.findOne({ email })
  if (!user) throw { code: 404, message: 'User not found' }

  user.set('tokens', undefined)
  await user.save()
  return user
}

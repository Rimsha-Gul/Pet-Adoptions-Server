import User from '../models/User'

export const removeTokensInDB = async (email: string) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = (await User.findOne({ email }))!

  user.set('tokens', undefined)
  await user.save()
  return user
}

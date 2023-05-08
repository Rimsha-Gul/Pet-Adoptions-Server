import UserModel from "../models/User";

export const removeTokensInDB = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) return;

  user.tokens.splice(0);
  await user.save();
  return;
};

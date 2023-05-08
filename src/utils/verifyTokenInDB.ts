import UserModel from "../models/User";
import { removeTokensInDB } from "./removeTokensInDB";

export const verifyTokenInDB = async (
  email: string,
  token: string,
  tokenType: "accessToken" | "refreshToken"
) => {
  const User = await UserModel.findOne({ email });

  if (!User) return undefined;
  const currentTokenObj = User.tokens.find(
    (tokenaccess: any) => tokenaccess[tokenType] === token
  );

  if (!currentTokenObj) return undefined;
  else {
    await removeTokensInDB(User.email);
    return {
      mail: User.email,
    };
  }
};

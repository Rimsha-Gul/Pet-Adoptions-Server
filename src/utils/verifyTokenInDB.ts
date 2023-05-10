import User from "../models/User";
import { removeTokensInDB } from "./removeTokensInDB";
import { RequestUser } from "../types/RequestUser";

export const fetchLatestAutoExec = async (
  reqUser: RequestUser
): Promise<RequestUser | undefined> => {
  const dbUser = await User.findOne({ email: reqUser.email });

  if (!dbUser) return undefined;

  return {
    email: dbUser.email,
  };
};

export const verifyTokenInDB = async (
  email: string,
  token: string,
  tokenType: "accessToken" | "refreshToken"
) => {
  const user = await User.findOne({ email });

  if (!user) return undefined;

  let currentTokenObj;
  if (user.tokens.accessToken === token || user.tokens.refreshToken === token) {
    currentTokenObj = token;
  }

  if (!currentTokenObj) return undefined;
  else {
    return {
      email: user.email,
    };
  }
};

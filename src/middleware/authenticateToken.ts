import { RequestHandler, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyTokenInDB } from "../utils/verifyTokenInDB";
import { Request } from "../types/Request";
//import { fetchLatestAutoExec } from "../utils/verifyTokenInDB";

export const authenticateAccessToken: RequestHandler = async (
  req,
  res,
  next
) => {
  //await fetchLatestAutoExec(req.session.user);

  await authenticateToken(
    req,
    res,
    next,
    process.env.ACCESS_TOKEN_SECRET || "",
    "accessToken"
  );
};

export const authenticateRefreshToken: RequestHandler = async (
  req,
  res,
  next
) => {
  await authenticateToken(
    req,
    res,
    next,
    process.env.REFRESH_TOKEN_SECRET || "",
    "refreshToken"
  );
};

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
  key: string,
  tokenType: "accessToken" | "refreshToken"
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  try {
    req.user = {
      email: "example@email.com",
    };
    if (!token) throw "Unauthorized";
    const data: any = jwt.verify(token, key);

    const user = await verifyTokenInDB(data?.email, token, tokenType);
    if (!user) {
      console.log(user);
      throw "Unauthorized";
    }
    if (req.user) {
      req.user.email = user.email;
    }
    return next();
  } catch (error) {
    res.sendStatus(401);
  }
};

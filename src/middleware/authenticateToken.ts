import { RequestHandler, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyTokenInDB } from "../utils/verifyTokenInDB";

export const authenticateAccessToken: RequestHandler = async (
  req,
  res,
  next
) => {
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
    if (!token) throw "Unauthorized";
    const data: any = jwt.verify(token, key);

    console.log(data?.email);
    const user = await verifyTokenInDB(data?.email, token, tokenType);
    if (user) {
      return next();
    }

    throw "Unauthorized";
  } catch (error) {
    res.sendStatus(401);
  }
};

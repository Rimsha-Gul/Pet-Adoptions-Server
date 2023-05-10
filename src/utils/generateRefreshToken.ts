import jwt from "jsonwebtoken";

export const generateRefreshToken = (email: String) =>
  jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "1d",
  });

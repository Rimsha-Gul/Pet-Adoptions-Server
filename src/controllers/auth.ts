import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { generateAccessToken } from "../utils/generateAccessToken";
import { generateRefreshToken } from "../utils/generateRefreshToken";
import { UserResponse, TokenResponse } from "../models/User";
import { removeTokensInDB } from "../utils/removeTokensInDB";
import {
  Example,
  Hidden,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";

@Route("auth")
@Tags("Auth")
export class AuthController {
  /**
   * @summary Accepts user info, creates user and returns user info along JWT tokens
   *
   */
  @Example<UserResponse>({
    name: "John Doe",
    email: "johndoe@example.com",
    address: "123 Main St",
    password: "********",
    tokens: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  })
  @Post("/signup")
  public async signup(@Request() req: express.Request): Promise<UserResponse> {
    return signup(req);
  }

  /**
   * @summary Verifies the user's email and password and returns JWT eokens
   */
  @Example<TokenResponse>({
    tokens: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  })
  @Post("/login")
  public async login(@Request() req: express.Request): Promise<TokenResponse> {
    return login(req);
  }

  /**
   * @summary Removes JWT tokens and returns nothing
   */
  @Security("bearerAuth")
  @Post("/logout")
  public async logout(@Query("req") @Hidden() req?: any) {
    return logout(req);
  }
}

const signup = async (req: any): Promise<UserResponse> => {
  // existing user check
  // hashed password
  // user creation
  // token generation
  const { name, email, address, password } = req;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw "User already exists.";
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    name: name,
    email: email,
    address: address,
    password: hashedPassword,
  });
  await user.save();
  const accessToken = generateAccessToken(user.email);
  const refreshToken = generateRefreshToken(user.email);
  user.tokens = {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
  await user.save();
  return {
    name: user.name,
    email: user.email,
    address: user.address,
    password: user.password,
    tokens: user.tokens,
  };
};

const login = async (req: any): Promise<TokenResponse> => {
  const { email, password } = req;

  const user = await User.findOne({ email });
  if (!user) {
    throw "User not found";
  }

  const expectedPassword = await bcrypt.compare(password, user.password);
  if (!expectedPassword) {
    throw "Invalid credentials";
  }

  const accessToken = generateAccessToken(user.email);
  const refreshToken = generateRefreshToken(user.email);

  user.tokens = {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
  await user.save();
  return { tokens: user.tokens };
};

const logout = async (req: any) => {
  await removeTokensInDB(req.user.email);
};

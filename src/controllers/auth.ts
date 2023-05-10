import { Request } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { generateAccessToken } from "../utils/generateAccessToken";
import { generateRefreshToken } from "../utils/generateRefreshToken";
import { UserResponse, LoginResponse } from "../models/User";
import { removeTokensInDB } from "../utils/removeTokensInDB";

export class AuthController {
  public async signup(req: Request): Promise<UserResponse> {
    // existing user check
    // hashed password
    // user creation
    // token generation

    const { name, email, password, address } = req.body;
    if (!name || !email || !password || !address) {
      throw "A credential is missing.";
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw "User already exists.";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      address,
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
  }

  public async login(req: Request): Promise<LoginResponse> {
    const { email, password } = req.body;
    if (!email || !password) {
      throw "A credential is missing.";
    }

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
  }

  public async logout(req: any) {
    await removeTokensInDB(req.user.email);
  }
}

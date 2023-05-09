import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { generateAccessToken } from "../utils/generateAccessToken";
import { generateRefreshToken } from "../utils/generateRefreshToken";

export class AuthController {
  public async signup(req: Request, res: Response) {
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
    user.save().then((user) => user.toObject());
    const token = generateAccessToken(user.email);
    return { user, token };
  }

  public async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const expectedPassword = await bcrypt.compare(password, user.password);
    if (!expectedPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user.email);
    const refreshToken = generateRefreshToken(user.email);

    user.tokens = {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    res.cookie("user_id", user._id);
    await user.save();
    return { accessToken, refreshToken };
  }

  public async logout(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400);
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    //user.tokens.splice(0);
    await user.save();
  }
}

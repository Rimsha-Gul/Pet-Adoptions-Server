import { Request, Response } from "express";
import { createUser } from "../utils/createUser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import UserModel from "../models/User";

export class AuthController {
  public async signup(req: Request, res: Response) {
    // existing user check
    // hashed password
    // user creation
    // token generation

    const { name, email, password, address } = req.body;
    if (!name || !email || !password || !address) {
      return res.status(400).json("User already exists.");
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      name,
      email,
      address,
      password: hashedPassword,
    });
    const SECRET = process.env.ACCESS_TOKEN_SECRET;
    const token = jwt.sign({ email: user.email, id: user._id }, `${SECRET}`, {
      expiresIn: "1m",
    });
    return { user, token };
  }

  public async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400);
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const expectedPassword = await bcrypt.compare(password, user.password);
    if (!expectedPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
    const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
    const accessToken = jwt.sign(
      { email: user.email, id: user._id },
      `${ACCESS_SECRET}`,
      {
        expiresIn: "1m",
      }
    );
    const refreshToken = jwt.sign(
      { email: user.email, id: user._id },
      `${REFRESH_SECRET}`,
      {
        expiresIn: "1d",
      }
    );
    user.tokens.push({
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
    await user.save();
    return { accessToken, refreshToken };
  }

  public async logout(req: Request, res: Response) {
    console.log(req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400);
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    console.log("reached here");
    //user.tokens.splice(0);
    await user.save();
  }
}
